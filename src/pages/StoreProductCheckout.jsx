import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import e2eCrypto from '../utils/e2eCrypto';

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

// =========================
// 임시 쿠폰 데이터
// 백엔드 쿠폰 API 연결 전까지 화면 테스트용으로 사용
// =========================
const MOCK_COUPONS = [
  {
    couponId: 1,
    couponName: '웰컴 쿠폰',
    discountType: 'FIXED',
    discountValue: 5000,
    description: '신규 가입자 5,000원 할인',
    usable: true
  },
  {
    couponId: 2,
    couponName: '마켓 첫 결제 쿠폰',
    discountType: 'RATE',
    discountValue: 10,
    maxDiscountAmount: 10000,
    description: '10% 할인, 최대 10,000원',
    usable: true
  },
  {
    couponId: 3,
    couponName: '만료된 테스트 쿠폰',
    discountType: 'FIXED',
    discountValue: 3000,
    description: '사용 기간이 지난 쿠폰',
    usable: false
  }
];

// =========================
// 쿠폰 할인 금액 계산
// FIXED: 정액 할인
// RATE: 비율 할인
// =========================
function calculateCouponDiscount(coupon, baseAmount) {
  if (!coupon) return 0;

  const safeBaseAmount = Number(baseAmount || 0);

  if (safeBaseAmount <= 0) return 0;

  if (coupon.discountType === 'RATE') {
    const rateDiscount = Math.floor(
      safeBaseAmount * Number(coupon.discountValue || 0) / 100
    );

    return Math.min(
      rateDiscount,
      Number(coupon.maxDiscountAmount || rateDiscount),
      safeBaseAmount
    );
  }

  return Math.min(
    Number(coupon.discountValue || 0),
    safeBaseAmount
  );
}

// =========================
// 쿠폰 선택 박스에 보여줄 할인 문구 생성
// 예: 5,000원 할인 / 10% 할인, 최대 10,000원
// =========================
function getCouponBenefitText(coupon) {
  if (!coupon) return '';

  if (coupon.discountType === 'RATE') {
    const maxText = coupon.maxDiscountAmount
      ? `, 최대 ${formatPrice(coupon.maxDiscountAmount)}`
      : '';

    return `${coupon.discountValue}% 할인${maxText}`;
  }

  return `${formatPrice(coupon.discountValue)} 할인`;
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
  const [welcomeDiscountAmount, setWelcomeDiscountAmount] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // 쿠폰 목록
  const [coupons, setCoupons] = useState([]);
  // 사용자가 선택한 쿠폰 ID
  const [selectedCouponId, setSelectedCouponId] = useState('');
  // 결제 전 최종 금액 확인 모달 표시 여부
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const canPay = agreePrivacy && agreeThirdParty;

<<<<<<< HEAD
  // =========================
  // 결제 금액 계산
  // 화면 표시용 계산이며, 실제 검증은 나중에 백엔드에서 다시 해야 함
  // =========================

  // 서비스 원래 금액
  const baseAmount = Number(checkout?.baseAmount || 0);

  // 기존 할인 금액
  const originalDiscountAmount = Number(checkout?.discountAmount || 0);

  // 선택된 쿠폰 찾기
  const selectedCoupon = coupons.find(
    (coupon) => String(coupon.couponId) === String(selectedCouponId)
  );

  // 쿠폰 할인 금액
  const couponDiscountAmount = calculateCouponDiscount(
    selectedCoupon,
    baseAmount
  );

  // 전체 할인 금액
  const totalDiscountAmount = Math.min(
    originalDiscountAmount + couponDiscountAmount,
    baseAmount
  );

  // 최종 결제 금액
  const finalAmount = Math.max(baseAmount - totalDiscountAmount, 0);
=======
  const [rsaPublicKey, setRsaPublicKey] = useState(null);
>>>>>>> main

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPublicKey = async () => {
      try {
        const res = await api.get('/api/payments/public-key');
        setRsaPublicKey(res?.publicKey || res?.data?.publicKey || res);
      } catch (error) {
        console.error('공개키 로딩 실패:', error);
      }
    };

    const loadCheckout = async () => {
      try {
        const res = await api.get(`/api/checkout/bookings/${bookingId}`);
        setCheckout(res.result);

        // 쿠폰 API 연결 전까지 임시 쿠폰 목록 사용
        setCoupons(MOCK_COUPONS);

        // 백엔드 연결 후 교체 예정
        // const couponRes = await api.get(
        //   `/api/coupons/usable?targetType=BOOKING&targetId=${bookingId}`
        // );
        // setCoupons(couponRes.result);
      } catch (err) {
        setMsg(err.message || '결제 정보를 불러오지 못했습니다.');
      }
    };

    fetchPublicKey();
    loadCheckout();
  }, [bookingId]);

  // 결제하기 버튼 클릭 시 Toss를 바로 띄우지 않고 확인 모달만 연다.
  const handlePaymentClick = () => {
    if (!canPay) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    if (finalAmount <= 0) {
      alert('결제 금액을 확인할 수 없습니다.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!canPay) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    if (isPaying) return;

    try {
      setIsPaying(true);

      if (!rsaPublicKey) {
        alert('보안 연결(키 교환)이 완료되지 않았습니다.');
        setIsPaying(false);
        return;
      }

      // E2E 평문 페이로드
      const payloadData = {
        targetType: 'BOOKING',
        targetId: Number(bookingId),
        paymentMethod,
        pgProvider: 'TEST_PG',
<<<<<<< HEAD
        couponId: selectedCoupon ? selectedCoupon.couponId : null
      });

      const orderId = prepareRes.result?.orderId;

      // 현재는 프론트에서 계산한 쿠폰 적용 금액을 사용
      const paymentAmount = Number(finalAmount);
=======
        welcomeDiscountAmount: welcomeDiscountAmount // 디버거로 조작해 볼 변수
      };

      const encryptedDto = e2eCrypto.encryptPayload(payloadData, rsaPublicKey);

      const prepareRes = await api.post('/api/payments/prepare', encryptedDto);
      const cipherTextFromDb = prepareRes?.result?.cipherText || prepareRes?.data?.cipherText || prepareRes?.cipherText;

      if (!cipherTextFromDb) {
        throw new Error('서버로부터 암호화된 응답을 받지 못했습니다.');
      }

      const decryptedRes = e2eCrypto.decryptResponse(cipherTextFromDb);
      console.log('해독된 준비 응답:', decryptedRes);

      const orderId = decryptedRes?.orderId ?? decryptedRes?.transaction?.orderId;
      const finalAmount = Number(decryptedRes?.finalAmount ?? checkout.finalAmount ?? 0);
>>>>>>> main

      if (!orderId) {
        alert('주문번호를 확인할 수 없습니다.');
        return;
      }

<<<<<<< HEAD
      if (paymentAmount <= 0) {
=======
      if (finalAmount === undefined || isNaN(finalAmount)) {
>>>>>>> main
        alert('결제 금액을 확인할 수 없습니다.');
        return;
      }

<<<<<<< HEAD
      setShowConfirmModal(false);

      // Toss Payments 연동
      const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
      tossPayments.requestPayment('카드', {
        amount: paymentAmount,
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
=======
      // 서버가 E2E 통신 후 내려준 "진짜" 결제 데이터를 모달에 세팅
      setConfirmData({
        orderId,
        finalAmount,
        orderName: checkout.productTitle || '예약 결제'
>>>>>>> main
      });
      setShowConfirmModal(true);

    } catch (err) {
      alert(err.message || '결제 준비에 실패했습니다.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleTossPayment = () => {
    if (!confirmData) return;
    
    const tossPayments = window.TossPayments('test_ck_GePWvyJnrKmlw5N22DXR3gLzN97E');
    
    let tossMethod = '카드';
    let tossOptions = {
      amount: confirmData.finalAmount,
      orderId: confirmData.orderId,
      orderName: confirmData.orderName,
      customerName: '고객명',
      successUrl: window.location.origin + '/payment/success',
      failUrl: window.location.origin + '/payment/fail',
    };

    if (paymentMethod === 'KAKAO') {
       tossOptions.flowMode = 'DIRECT';
       tossOptions.easyPay = '카카오페이';
    } else if (paymentMethod === 'NAVER') {
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
          <label className="checkout-radio" style={{marginLeft: '12px'}}>
            <input
              type="radio"
              name="paymentMethod"
              value="KAKAO"
              checked={paymentMethod === 'KAKAO'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>카카오페이</span>
          </label>
        </section>

        <section className="checkout-section">
          <h2>할인 혜택</h2>
          <div className="checkout-price-box">
            <div className="checkout-price-row">
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
        </section>

        <section className="checkout-section">
          <div className="checkout-section-title-row">
            <h2>쿠폰 할인</h2>
            <small>사용 가능한 쿠폰을 선택해주세요.</small>
          </div>

          <div className="checkout-coupon-box">
            {/* 쿠폰 선택 */}
            <select
              className="checkout-coupon-select"
              value={selectedCouponId}
              onChange={(e) => setSelectedCouponId(e.target.value)}
            >
              <option value="">쿠폰 선택 안 함</option>

              {coupons.map((coupon) => (
                <option
                  key={coupon.couponId}
                  value={coupon.couponId}
                  disabled={!coupon.usable}
                >
                  {coupon.couponName} - {getCouponBenefitText(coupon)}
                  {!coupon.usable ? ' (사용 불가)' : ''}
                </option>
              ))}
            </select>

            {/* 선택한 쿠폰 정보 */}
            {selectedCoupon ? (
              <div className="checkout-selected-coupon">
                <div>
                  <strong>{selectedCoupon.couponName}</strong>
                  <p>{selectedCoupon.description}</p>
                </div>

                <b>-{formatPrice(couponDiscountAmount)}</b>
              </div>
            ) : (
              <p className="checkout-coupon-empty">
                적용된 쿠폰이 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="checkout-section">
          <h2>결제금액</h2>

          <div className="checkout-price-box">
            <div className="checkout-price-row">
              <span>서비스 금액</span>
              <strong>{formatPrice(baseAmount)}</strong>
            </div>

            <div className="checkout-price-row">
              <span>기본 할인 금액</span>
              <strong>-{formatPrice(originalDiscountAmount)}</strong>
            </div>

            <div className="checkout-price-row discount">
              <span>쿠폰 할인 금액</span>
              <strong>-{formatPrice(couponDiscountAmount)}</strong>
            </div>

            <div className="checkout-price-divider" />

            <div className="checkout-price-row total">
              <span>최종 결제 금액</span>
<<<<<<< HEAD
              <strong>{formatPrice(finalAmount)}</strong>
=======
              <strong>{formatPrice(Math.max(0, checkout.baseAmount - checkout.discountAmount - welcomeDiscountAmount))}</strong>
>>>>>>> main
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
          onClick={handlePaymentClick}
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

<<<<<<< HEAD
      {showConfirmModal && (
        <div className="checkout-confirm-overlay">
          <div className="checkout-confirm-modal">
            {/* 모달 닫기 */}
            <button
              type="button"
              className="checkout-confirm-close"
              onClick={() => setShowConfirmModal(false)}
            >
              ×
            </button>

            <h2>최종 결제 금액 확인</h2>

            <p className="checkout-confirm-desc">
              결제창으로 이동하기 전에 상품과 결제 금액을 확인해주세요.
            </p>

            {/* 결제 상품명 */}
            <div className="checkout-confirm-product">
              <span>상품명</span>
              <strong>{checkout.productTitle || '-'}</strong>
            </div>

            {/* 결제 금액 요약 */}
            <div className="checkout-confirm-summary">
              <div>
                <span>서비스 금액</span>
                <strong>{formatPrice(baseAmount)}</strong>
              </div>

              <div>
                <span>선택 쿠폰</span>
                <strong>{selectedCoupon?.couponName || '선택 안 함'}</strong>
              </div>

              <div>
                <span>총 할인 금액</span>
                <strong>-{formatPrice(totalDiscountAmount)}</strong>
              </div>

              <div className="checkout-confirm-total">
                <span>최종 결제 금액</span>
                <strong>{formatPrice(finalAmount)}</strong>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="checkout-confirm-actions">
              <button
                type="button"
                className="checkout-confirm-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                취소
              </button>

              <button
                type="button"
                className="checkout-confirm-pay"
                disabled={isPaying}
                onClick={handleConfirmPayment}
              >
                {isPaying ? '결제 준비 중...' : `${formatPrice(finalAmount)} 결제하기`}
              </button>
            </div>
          </div>
        </div>
      )}
=======
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
              <strong style={{color: '#00c7ae', fontSize: '1.5rem'}}>{formatPrice(confirmData.finalAmount)}</strong>
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

>>>>>>> main
    </section>
  );
}