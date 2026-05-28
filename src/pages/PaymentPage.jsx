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

  // 토스페이먼츠 연동이므로 결제수단 선택 UI만 껍데기로 두고 고정해도 됩니다. (원래 UI 유지)
  const [selectedMethod, setSelectedMethod] = useState('CARD');

  // E2E 암호화를 위한 서버 RSA 공개키
  const [rsaPublicKey, setRsaPublicKey] = useState(null);

  useEffect(() => {
    loadPayment();
    fetchPublicKey();
  }, []);

  async function fetchPublicKey() {
    try {
      const res = await api.get('/api/payments/public-key');
      // 응답 형식이 axios 혹은 fetch에 따라 다를 수 있으나 보통 res.data.publicKey 임.
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

      // --- [모의 해킹 실습 포인트] ---
      // 클라이언트 측에서 "결제하기"를 누를 때, 백엔드로 넘길 평문 파라미터입니다.
      // 해커는 브라우저 디버거(Sources 탭)에서 이 함수에 Breakpoint를 걸고
      // 아래의 welcomeDiscountAmount 값을 99900 등으로 변조하여 암호화 로직을 태웁니다.
      const payloadData = {
        itemId: payment?.itemId || 1, 
        welcomeDiscountAmount: 0, // 디버거로 조작해 볼 변수!
        orderName: payment?.orderName || '결제 서비스'
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

      const { finalAmount, orderId } = decryptedRes;

      if (!orderId || !finalAmount) {
        throw new Error('결제 서버 응답 데이터가 유효하지 않습니다.');
      }

      // 4) 토스 결제창 띄우기 (드디어 평문화된 최종 금액으로 팝업 호출)
      const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
      
      tossPayments.requestPayment('카드', {
        amount: finalAmount, // E2E 서버에서 해독해서 가져온 최종 금액 (해커가 조작했다면 100원)
        orderId: orderId,
        orderName: payloadData.orderName,
        customerName: '고객명',
        successUrl: window.location.origin + `/payment/success?roomId=${roomId || ''}`,
        failUrl: window.location.origin + '/payment/fail',
      }).catch(function (error) {
        if (error.code === 'USER_CANCEL') {
          alert('결제를 취소하셨습니다.');
        } else {
          alert(error.message);
        }
      });
    } catch (err) {
      console.error('결제 에러:', err);
      alert(err?.message || '결제 진행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !payment) {
    return <div className="container">로딩중...</div>;
  }

  return (
    <Page
      title="결제하기"
      desc="결제를 진행해주세요."
    >
      <div className="payment-page">

        {/* 예약 상품 */}
        <div className="payment-card">
          <h3 className="payment-title">예약 상품</h3>
          <div className="payment-row">
            <span>서비스명</span>
            <b>{payment.orderName || '결제 서비스'}</b>
          </div>
          <div className="payment-row">
            <span>주문번호</span>
            <b>{payment.orderId}</b>
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
              <b>{Number(payment.paymentAmount || payment.amount || 0).toLocaleString()}원</b>
            </div>
            <div className="payment-row total">
              <span>최종 결제 금액</span>
              <strong>{Number(payment.paymentAmount || payment.amount || 0).toLocaleString()}원</strong>
            </div>
          </div>
        </div>

        {/* 결제 버튼 */}
        <button
          className="payment-submit-btn"
          onClick={handleConfirmPayment}
          disabled={loading}
        >
          {loading ? '결제 진행중...' : '결제하기'}
        </button>

      </div>
    </Page>
  );
}

