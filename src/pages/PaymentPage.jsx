import { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { api } from '../api/client';

export default function PaymentPage() {

  const { paymentId } = useParams();
  console.log(paymentId);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [payment, setPayment] = useState(null);

  useEffect(() => {

    loadPayment();

  }, []);

  async function loadPayment() {

    try {

      const res = await api.get(
        `/api/payments/${paymentId}`
        );

      console.log('결제 상세', res);

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

      const paymentKey =
        `MOCK-${Date.now()}`;

      const orderId =
        payment?.orderId;

      const amount =
        payment?.amount;

      await api.post(
        '/api/payments/confirm',
        {
          paymentKey,
          orderId,
          amount
        }
      );

      alert('결제가 완료되었습니다.');

      navigate('/chat');

    } catch (err) {

      console.error(err);

      alert(
        err?.message ||
        '결제에 실패했습니다.'
      );
    }
  }

  if (loading) {

    return (
      <div className="container">
        로딩중...
      </div>
    );
  }

  if (!payment) {

    return (
      <div className="container">
        결제 정보가 없습니다.
      </div>
    );
  }

  return (

    <div className="container">

      <div
        style={{
          maxWidth: 700,
          margin: '0 auto'
        }}
      >

        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 30
          }}
        >
          결제하기
        </h1>

        <div className="panel">

          <h2>결제 정보</h2>

          <div
            style={{
              marginTop: 20,
              lineHeight: 2
            }}
          >

            <div>
              <b>주문번호</b>
              <div>
                {payment.orderId}
              </div>
            </div>

            <div>
              <b>결제금액</b>
              <div>
                {
                  Number(
                    payment.amount || 0
                  ).toLocaleString()
                }원
              </div>
            </div>

            <div>
              <b>결제수단</b>
              <div>
                카드결제
              </div>
            </div>

            <div>
              <b>상태</b>
              <div>
                {payment.status}
              </div>
            </div>

          </div>

          <button
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: 30,
              height: 56,
              fontSize: 18
            }}
            onClick={handleConfirmPayment}
          >
            결제하기
          </button>

        </div>

      </div>

    </div>
  );
}

