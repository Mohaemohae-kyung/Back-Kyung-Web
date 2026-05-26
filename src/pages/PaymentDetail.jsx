import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { api } from '../api/client';
import { Page } from '../components/common';

export default function PaymentDetail() {

  const { paymentId } = useParams();

  const [payment, setPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // 선택된 결제수단
  const [selectedMethod, setSelectedMethod] =
    useState('CARD');

  useEffect(() => {

    api.get(`/api/payments/${paymentId}`)
      .then(res => {

        console.log('결제 상세 응답', res);

        setPayment(
          res.result || res
        );

      })
      .catch(console.error);

  }, [paymentId]);

  if (!payment) {
    return <div>로딩중...</div>;
  }

  const handlePayment = async () => {

    try {

      setLoading(true);

      // Mock PG 승인 payload
      const approvePayload = {
        orderId: payment.orderId,
        amount: payment.paymentAmount,
        paymentMethod: selectedMethod
      };

      console.log('approve payload');
      console.log(approvePayload);

      // 1. Mock PG 승인
      const approveRes = await api.post(
        '/api/mock-pg/approve',
        approvePayload
      );

      console.log('approve response');
      console.log(approveRes);

      // paymentKey 추출
      const paymentKey =
        approveRes?.result?.paymentKey ||
        approveRes?.paymentKey;

      // 실제 승인 payload
      const confirmPayload = {
        orderId: payment.orderId,
        paymentKey,
        amount: payment.paymentAmount
      };

      console.log('confirm payload');
      console.log(confirmPayload);

      // 2. 실제 승인 확정
      await api.post(
        '/api/payments/confirm',
        confirmPayload
      );

      alert('결제 완료');

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        '결제 실패'
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <Page
      title="결제하기"
      desc="결제를 진행해주세요."
    >

      <div className="payment-page">

        {/* 예약 상품 */}
        <div className="payment-card">

          <h3 className="payment-title">
            예약 상품
          </h3>

          <div className="payment-row">
            <span>서비스명</span>

            <b>
              {payment.orderName}
            </b>
          </div>

          <div className="payment-row">
            <span>주문번호</span>

            <b>
              {payment.orderId}
            </b>
          </div>

        </div>

        {/* 결제수단 */}
        <div className="payment-card">

          <h3 className="payment-title">
            결제수단
          </h3>

          <div className="payment-method-list">

            <button
              type="button"
              className={`payment-method-btn ${
                selectedMethod === 'CARD'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setSelectedMethod('CARD')
              }
            >
              신용/체크카드
            </button>

            <button
              type="button"
              className={`payment-method-btn ${
                selectedMethod === 'KAKAO'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setSelectedMethod('KAKAO')
              }
            >
              카카오페이
            </button>

            <button
              type="button"
              className={`payment-method-btn ${
                selectedMethod === 'NAVER'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setSelectedMethod('NAVER')
              }
            >
              네이버페이
            </button>

          </div>

        </div>

        {/* 결제금액 */}
        <div className="payment-card">

          <h3 className="payment-title">
            결제금액
          </h3>

          <div className="payment-price-box">

            <div className="payment-row">
              <span>서비스 금액</span>

              <b>
                {Number(payment.paymentAmount)
                  .toLocaleString()}원
              </b>
            </div>

            <div className="payment-row total">
              <span>최종 결제 금액</span>

              <strong>
                {Number(payment.paymentAmount)
                  .toLocaleString()}원
              </strong>
            </div>

          </div>

        </div>

        {/* 결제 버튼 */}
        <button
          className="payment-submit-btn"
          onClick={handlePayment}
          disabled={loading}
        >
          {
            loading
              ? '결제 진행중...'
              : '결제하기'
          }
        </button>

      </div>

    </Page>
  );
}