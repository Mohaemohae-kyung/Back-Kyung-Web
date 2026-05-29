import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { api } from '../api/client';
import { Page } from '../components/common';
import e2eCrypto from '../utils/e2eCrypto';

export default function PaymentPage() {

  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId;

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState('CARD');
  const [welcomeDiscountAmount, setWelcomeDiscountAmount] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // E2E 암호화를 위한 서버 RSA 공개키
  const [rsaPublicKey, setRsaPublicKey] = useState(null);

  useEffect(() => {
    loadPayment();
    fetchPublicKey();
  }, []);

  async function fetchPublicKey() {
    try {
      const res = await api.get('/api/payments/public-key');
      setRsaPublicKey(res?.publicKey || res?.data?.publicKey || res);
    } catch (error) {
      console.error('공개키 로딩 실패:', error);
    }
  }

  async function loadPayment() {
    try {
      const res = await api.get(`/api/payments/${paymentId}`);
      setPayment(
        res?.result ||
        res?.data?.result ||
        res?.data
      );
    } catch (err) {
      console.error(err);
      alert('결제 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment() {
    try {
      if (!rsaPublicKey) {
        alert('보안 연결 설정(키 교환) 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      setLoading(true);

      const targetType = payment?.bookingId ? 'BOOKING' : 'SERVICE_REQUEST';
      const targetId = payment?.bookingId || payment?.serviceRequestId;

      if (!targetId) {
        alert('결제 대상 정보가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      // --- [모의 해킹 실습 포인트] ---
      // 클라이언트 측에서 "결제하기"를 누를 때, 백엔드로 넘길 평문 파라미터입니다.
      // 해커는 브라우저 디버거(Sources 탭)에서 이 함수에 Breakpoint를 걸고
      // 아래의 welcomeDiscountAmount 값을 99900 등으로 변조하여 암호화 로직을 태웁니다.
      const payloadData = {
        targetType,
        targetId,
        paymentMethod: selectedMethod,
        pgProvider: 'TEST_PG',
        welcomeDiscountAmount: welcomeDiscountAmount // 디버거로 조작해 볼 변수!
      };

      console.log('1. 암호화 전 평문 데이터:', payloadData);

      // 1) E2E 하이브리드 암호화 (AES 대칭키 생성 -> RSA 암호화)
      const encryptedDto = e2eCrypto.encryptPayload(payloadData, rsaPublicKey);
      
      console.log('2. E2E 암호화 완료, 서버(프록시)로 전송:', encryptedDto);

      // 2) 서버에 결제 준비(Prepare) 요청
      const prepareRes = await api.post('/api/payments/prepare', encryptedDto);
      const cipherTextFromDb = prepareRes?.result?.cipherText || prepareRes?.data?.cipherText || prepareRes?.cipherText;

      if (!cipherTextFromDb) {
        throw new Error('서버로부터 암호화된 응답을 받지 못했습니다.');
      }

      // 3) 서버 응답(결제 서버가 만든 최종 금액 등) 복호화
      const decryptedRes = e2eCrypto.decryptResponse(cipherTextFromDb);
      console.log('3. 서버 응답 로컬 해독 완료:', decryptedRes);

      const finalAmount = decryptedRes?.finalAmount ?? decryptedRes?.transaction?.finalAmount;
      const orderId = decryptedRes?.orderId ?? decryptedRes?.transaction?.orderId;

      if (!orderId || finalAmount === undefined) {
        throw new Error('결제 서버 응답 데이터가 유효하지 않습니다.');
      }

      // 서버가 E2E 통신 후 내려준 "진짜" 결제 데이터를 모달에 세팅
      setConfirmData({
        orderId,
        finalAmount: Number(finalAmount),
        orderName: payment.orderName || '결제 서비스'
      });
      setShowConfirmModal(true);

    } catch (err) {
      console.error('결제 에러:', err);
      alert(err?.message || '결제 진행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleTossPayment = () => {
    if (!confirmData) return;
    
    // 4) 토스 결제창 띄우기 (간편결제 등 토스 옵션 호환 처리)
    const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
    
    let tossMethod = '카드';
    let tossOptions = {
      amount: confirmData.finalAmount, // E2E 서버에서 해독해서 가져온 최종 금액
      orderId: confirmData.orderId,
      orderName: confirmData.orderName,
      customerName: '고객명',
      successUrl: window.location.origin + `/payment/success?roomId=${roomId || ''}`,
      failUrl: window.location.origin + '/payment/fail',
    };

    if (selectedMethod === 'KAKAO') {
       tossOptions.flowMode = 'DIRECT';
       tossOptions.easyPay = '카카오페이';
    } else if (selectedMethod === 'NAVER') {
       tossOptions.flowMode = 'DIRECT';
       tossOptions.easyPay = '네이버페이';
    }

    tossPayments.requestPayment(tossMethod, tossOptions).catch(function (error) {
      if (error.code === 'USER_CANCEL') {
        alert('결제를 취소하셨습니다.');
      } else {
        alert(error.message);
      }
    });
    
    setShowConfirmModal(false);
  };

  if (loading && !payment) {
    return <div className="container">로딩중...</div>;
  }

  if (!payment) {
    return <div className="container">결제 정보를 불러올 수 없습니다.</div>;
  }

  const baseAmount = Number(payment.totalAmount || payment.paymentAmount || payment.amount || 0);
  const discountAmount = Number(payment.discountAmount || 0) + Number(welcomeDiscountAmount);
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return (
    <Page
      title="결제하기"
      desc="결제를 진행해주세요."
    >
      <div className="payment-page">

        {/* 예약 상품 */}
        <div className="payment-card">
          <h3 className="payment-title">결제 상품</h3>
          <div className="payment-row">
            <span>서비스명</span>
            <b>{payment.orderName || '결제 서비스'}</b>
          </div>
          <div className="payment-row">
            <span>주문번호</span>
            <b>{payment.orderId || '-'}</b>
          </div>
        </div>

        {/* 웰컴 할인 (모의 해킹 타겟) */}
        <div className="payment-card">
          <h3 className="payment-title">할인 혜택</h3>
          <div className="payment-row">
            <span>웰컴 할인 적용</span>
            <select
              value={welcomeDiscountAmount}
              onChange={(e) => setWelcomeDiscountAmount(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value={0}>적용 안함</option>
              <option value={1000}>1,000원 할인</option>
            </select>
          </div>
        </div>

        {/* 결제수단 */}
        <div className="payment-card">
          <h3 className="payment-title">결제수단</h3>
          <div className="payment-method-list">
            <button
              type="button"
              className={`payment-method-btn ${selectedMethod === 'CARD' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('CARD')}
            >
              신용/체크카드
            </button>
            <button
              type="button"
              className={`payment-method-btn ${selectedMethod === 'KAKAO' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('KAKAO')}
            >
              카카오페이
            </button>
            <button
              type="button"
              className={`payment-method-btn ${selectedMethod === 'NAVER' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('NAVER')}
            >
              네이버페이
            </button>
          </div>
        </div>

        {/* 결제금액 */}
        <div className="payment-card">
          <h3 className="payment-title">결제금액</h3>
          <div className="payment-price-box">
            <div className="payment-row">
              <span>서비스 금액</span>
              <b>{baseAmount.toLocaleString()}원</b>
            </div>
            <div className="payment-row">
              <span>할인 금액</span>
              <b>-{discountAmount.toLocaleString()}원</b>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
            <div className="payment-row total">
              <span>최종 결제 금액</span>
              <strong style={{ fontSize: '1.2rem', color: '#111' }}>{finalAmount.toLocaleString()}원</strong>
            </div>
          </div>
        </div>

        {/* 결제 버튼 */}
        <button
          className="payment-submit-btn"
          onClick={handleConfirmPayment}
          disabled={loading}
          style={{ width: '100%', padding: '16px', backgroundColor: '#00c7ae', color: '#fff', fontSize: '1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' }}
        >
          {loading ? '결제 진행중...' : '결제하기'}
        </button>

      </div>
      
      {/* 결제 최종 확인 모달 (2단계 로직) */}
      {showConfirmModal && confirmData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', textAlign: 'center'}}>최종 결제 확인</h2>
            <div style={{marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: '#666'}}>결제 상품</span>
              <strong style={{textAlign: 'right'}}>{confirmData.orderName}</strong>
            </div>
            <div style={{marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: '#666'}}>주문 번호</span>
              <strong style={{textAlign: 'right', fontSize: '0.9rem'}}>{confirmData.orderId}</strong>
            </div>
            <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '24px 0'}} />
            <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: '#111', fontWeight: 'bold'}}>최종 승인 금액</span>
              <strong style={{color: '#00c7ae', fontSize: '1.5rem'}}>{confirmData.finalAmount.toLocaleString()}원</strong>
            </div>
            <button 
              onClick={handleTossPayment}
              style={{ width: '100%', padding: '16px', backgroundColor: '#00c7ae', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}
            >
              토스페이먼츠로 결제 진행
            </button>
            <button 
              onClick={() => setShowConfirmModal(false)}
              style={{ width: '100%', padding: '16px', backgroundColor: '#f1f3f5', color: '#333', fontSize: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

    </Page>
  );
}

