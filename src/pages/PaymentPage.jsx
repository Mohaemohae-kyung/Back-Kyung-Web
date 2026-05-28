import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { api } from '../api/client';
import { Page } from '../components/common';

export default function PaymentPage() {

  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId;

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  // 토스페이먼츠 연동이므로 결제수단 선택 UI만 껍데기로 두고 고정해도 됩니다. (원래 UI 유지)
  const [selectedMethod, setSelectedMethod] = useState('CARD');

  useEffect(() => {
    loadPayment();
  }, []);

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
      // Toss Payments 객체 초기화 (발급받은 테스트 클라이언트 키)
      const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
      
      const orderId = payment?.orderId;
      const amount = payment?.paymentAmount || payment?.amount;
      
      if (!orderId || !amount) {
        alert('결제 정보가 유효하지 않습니다.');
        return;
      }

      // 토스 결제창 띄우기
      tossPayments.requestPayment('카드', {
        amount: amount,
        orderId: orderId,
        orderName: payment?.orderName || '결제 서비스', // 실제로는 payment?.orderName 등 활용 가능
        customerName: '고객명', // 실제 유저 이름이 있다면 연동
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
      console.error(err);
      alert(err?.message || '결제창을 띄우는 데 실패했습니다.');
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

