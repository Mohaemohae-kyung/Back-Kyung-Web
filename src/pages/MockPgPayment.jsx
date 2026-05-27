import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { api } from '../api/client';

export default function MockPgPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentInfo = location.state;

  const [isApproving, setIsApproving] = useState(false);

  if (!paymentInfo) {
    return (
      <section className="container page">
        <div className="panel">
          <p className="error-text">결제 정보를 찾을 수 없습니다.</p>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/market')}
          >
            마켓으로 돌아가기
          </button>
        </div>
      </section>
    );
  }

  const {
    orderId,
    amount,
    paymentMethod,
    bookingId,
    storeProductId
  } = paymentInfo;

  const handleApprove = async () => {
    if (isApproving) return;

    try {
      setIsApproving(true);

      const approveRes = await api.post('/api/mock-pg/approve', {
        orderId,
        amount,
        paymentMethod
      });

      const paymentKey = approveRes.result?.paymentKey;

      if (!paymentKey) {
        alert('결제 승인 키를 확인할 수 없습니다.');
        return;
      }

      await api.post('/api/payments/confirm', {
        orderId,
        paymentKey,
        amount
      });

      alert('결제가 완료되었습니다.');

      navigate('/mypage', {
        state: {
          paymentCompleted: true,
          bookingId
        }
      });
    } catch (err) {
      alert(err.message || '결제 승인에 실패했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <section className="container page mock-pg-page">
      <div className="mock-pg-card">
        <h1>Mock PG 결제</h1>

        <p className="mock-pg-desc">
          실제 PG 결제창을 대신하는 테스트 결제 화면입니다.
        </p>

        <div className="mock-pg-info">
          <div>
            <span>주문번호</span>
            <strong>{orderId}</strong>
          </div>

          <div>
            <span>결제수단</span>
            <strong>{paymentMethod}</strong>
          </div>

          <div>
            <span>결제금액</span>
            <strong>{Number(amount || 0).toLocaleString()}원</strong>
          </div>
        </div>

        <button
          type="button"
          className="mock-pg-pay-button"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? '결제 승인 중...' : '결제 승인하기'}
        </button>

        <button
          type="button"
          className="mock-pg-cancel-button"
          onClick={() => navigate(`/store-products/${storeProductId}/checkout/${bookingId}`)}
        >
          결제 취소
        </button>
      </div>
    </section>
  );
}