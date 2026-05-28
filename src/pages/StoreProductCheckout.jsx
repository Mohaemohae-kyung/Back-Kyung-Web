import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
}

function formatTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function StoreProductCheckout() {
  const { storeProductId, bookingId } = useParams();
  const navigate = useNavigate();

  const [checkout, setCheckout] = useState(null);
  const [msg, setMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const canPay = agreePrivacy && agreeThirdParty;

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadCheckout = async () => {
      try {
        const res = await api.get(`/api/checkout/bookings/${bookingId}`);
        setCheckout(res.result);
      } catch (err) {
        setMsg(err.message || '결제 정보를 불러오지 못했습니다.');
      }
    };

    loadCheckout();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!canPay) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    if (isPaying) return;

    try {
      setIsPaying(true);

      const prepareRes = await api.post('/api/payments/prepare', {
        targetType: 'BOOKING',
        targetId: Number(bookingId),
        paymentMethod,
        pgProvider: 'TEST_PG'
      });

      const orderId = prepareRes.result?.orderId;
      const finalAmount = Number(
        prepareRes.result?.finalAmount ??
        checkout.finalAmount ??
        0
      );

      if (!orderId) {
        alert('주문번호를 확인할 수 없습니다.');
        return;
      }

      if (!finalAmount) {
        alert('결제 금액을 확인할 수 없습니다.');
        return;
      }

      // Toss Payments 연동
      const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
      tossPayments.requestPayment('카드', {
        amount: finalAmount,
        orderId: orderId,
        orderName: checkout.productTitle || '예약 결제',
        customerName: '고객명',
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/payment/fail',
      }).catch(function (error) {
        if (error.code === 'USER_CANCEL') {
          alert('결제를 취소하셨습니다.');
        } else {
          alert(error.message);
        }
      });
    } catch (err) {
      alert(err.message || '결제 준비에 실패했습니다.');
    } finally {
      setIsPaying(false);
    }
  };

  if (msg) {
    return (
      <section className="container page checkout-page">
        <div className="checkout-shell">
          <h1>예약하기</h1>

          <div className="checkout-card">
            <p className="error-text">{msg}</p>
            <Link to={`/store-products/${storeProductId}`} className="btn">
              상품 상세로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!checkout) {
    return (
      <section className="container page checkout-page">
        <div className="checkout-shell">
          <h1>예약하기</h1>

          <div className="checkout-card">
            <p className="muted">결제 정보를 불러오는 중입니다.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container page checkout-page">
      <div className="checkout-shell">
        <h1>예약하기</h1>

        <div className="checkout-notice">
          전자금액은 서비스 완료 후 고수에게 전달됩니다.
        </div>

        <section className="checkout-section">
          <h2>예약 상품</h2>

          <div className="checkout-info-list">
            <div className="checkout-info-row">
              <span>상품명</span>
              <strong>{checkout.productTitle || '-'}</strong>
            </div>

            <div className="checkout-info-row">
              <span>서비스명</span>
              <strong>{checkout.serviceTitle || '-'}</strong>
            </div>

            <div className="checkout-info-row">
              <span>고수명</span>
              <strong>{checkout.expertDisplayName || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-section">
          <div className="checkout-section-title-row">
            <h2>일정 정보</h2>
            <small>예약 일시는 서비스 진행 일정입니다.</small>
          </div>

          <div className="checkout-info-list">
            <div className="checkout-info-row">
              <span>예약 날짜</span>
              <strong>{formatDate(checkout.startAt)}</strong>
            </div>

            <div className="checkout-info-row">
              <span>예약 시간</span>
              <strong>
                {formatTime(checkout.startAt)}
                {' '}
                -
                {' '}
                {formatTime(checkout.endAt)}
              </strong>
            </div>

            <div className="checkout-info-row">
              <span>지역</span>
              <strong>{checkout.locationName || checkout.locationText || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-section">
          <h2>결제수단</h2>

          <label className="checkout-radio">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={paymentMethod === 'CARD'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>신용/체크카드</span>
          </label>
        </section>

        <section className="checkout-section">
          <h2>결제금액</h2>

          <div className="checkout-price-box">
            <div className="checkout-price-row">
              <span>서비스 금액</span>
              <strong>{formatPrice(checkout.baseAmount)}</strong>
            </div>

            <div className="checkout-price-row">
              <span>할인 금액</span>
              <strong>{formatPrice(checkout.discountAmount)}</strong>
            </div>

            <div className="checkout-price-divider" />

            <div className="checkout-price-row total">
              <span>최종 결제 금액</span>
              <strong>{formatPrice(checkout.finalAmount)}</strong>
            </div>
          </div>

          <div className="checkout-guide-box">
            <b>취소 환불은 어떻게 진행되나요?</b>
            <p>결제 후 일정 시간 이내에는 무료 취소가 가능합니다.</p>
            <p>결제 이후 서비스 일정에 가까워질수록 환불 조건이 달라질 수 있습니다.</p>
            <p>주문 취소는 마이페이지에서 가능하며, 고수와 서비스가 확정된 경우 고객님의 직접 확인이 필요합니다.</p>
          </div>
        </section>

        <section className="checkout-section">
          <h2>이용동의</h2>

          <div className="checkout-agree-row">
            <label>
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
              개인정보 수집 및 이용 동의(필수)
            </label>

            <button type="button">보기</button>
          </div>

          <div className="checkout-agree-row">
            <label>
              <input
                type="checkbox"
                checked={agreeThirdParty}
                onChange={(e) => setAgreeThirdParty(e.target.checked)}
              />
              제3자 정보 공유 동의(필수)
            </label>

            <button type="button">보기</button>
          </div>

          <div className="checkout-warning-box">
            <p>결제 후 실제 고수의 휴대전화번호 대신 안심번호가 고수에게 제공됩니다.</p>
            <p>매칭온은 통신판매중개자이며, 개별 판매자가 제공하는 서비스의 이행 및 계약 책임은 거래 당사자에게 있습니다.</p>
          </div>
        </section>

        <button
          type="button"
          className="checkout-pay-button"
          disabled={!canPay || isPaying}
          onClick={handlePayment}
        >
          {isPaying ? '결제 처리 중...' : '결제하기'}
        </button>

        <button
          type="button"
          className="checkout-back-button"
          onClick={() => navigate(`/store-products/${storeProductId}`)}
        >
          상품 상세로 돌아가기
        </button>
      </div>
    </section>
  );
}