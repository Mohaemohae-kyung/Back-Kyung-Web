import { useEffect, useState } from 'react';
import {
  Link,
  useParams
} from 'react-router-dom';

import { CalendarDays, CreditCard, MapPin, PackageCheck } from 'lucide-react';

import { api } from '../api/client';

const formatDate = (value) => {
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
};

const formatTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const bookingStatusLabel = (status) => {
  if (status === 'CONFIRMED') return '예약 확정';
  if (status === 'PENDING_PAYMENT') return '결제 대기';
  if (status === 'EXPIRED') return '만료';
  if (status === 'CANCELED') return '취소';
  return status || '-';
};

const serviceTypeLabel = (type) => {
  if (type === 'ONLINE') return '온라인';
  if (type === 'OFFLINE') return '대면';
  if (type === 'BOTH') return '온라인/대면';
  return type || '-';
};

export default function BookingDetail() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [product, setProduct] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadBooking = async () => {
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        const bookingData = res.result;

        setBooking(bookingData);

        const storeProductId =
          bookingData.storeProductId ||
          bookingData.productId;

        if (storeProductId) {
          try {
            const productRes = await api.get(`/api/store-products/${storeProductId}`);
            setProduct(productRes.result);
          } catch {
            setProduct(null);
          }
        }
      } catch (err) {
        setMsg(err.message || '예약 상세 정보를 불러오지 못했습니다.');
      }
    };

    loadBooking();
  }, [bookingId]);

  if (msg) {
    return (
      <section className="container page booking-detail-page">
        <div className="booking-detail-shell">
          <div className="panel booking-detail-error">
            <p className="error-text">{msg}</p>

            <Link to="/mypage" className="btn">
              마이페이지로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="container page booking-detail-page">
        <div className="booking-detail-shell">
          <div className="panel booking-detail-error">
            <p className="muted">예약 상세 정보를 불러오는 중입니다.</p>
          </div>
        </div>
      </section>
    );
  }

  const status =
    booking.status ||
    booking.bookingStatus;

  const isConfirmed = status === 'CONFIRMED';

  const amount =
    booking.finalAmount ??
    booking.paymentAmount ??
    booking.paidAmount ??
    booking.totalAmount ??
    booking.baseAmount ??
    product?.price ??
    booking.price ??
    null;

  return (
    <section className="container page booking-detail-page">
      <div className="booking-detail-shell">
        <div className="booking-detail-header">
          <div>
            <span className="booking-detail-eyebrow">
              예약 상세
            </span>

            <h1>예약 정보를 확인하세요</h1>

            <p>
              결제 완료된 예약의 상품, 일정, 결제 정보를 한 번에 볼 수 있어요.
            </p>
          </div>

          <span className={`booking-detail-status ${status?.toLowerCase()}`}>
            {bookingStatusLabel(status)}
          </span>
        </div>

        <div className="booking-detail-summary">
          <div className="booking-detail-summary-icon">
            <PackageCheck size={24} />
          </div>

          <div>
            <strong>
              {booking.productTitle || booking.serviceTitle || '예약 상품'}
            </strong>

            <p>
              {booking.expertDisplayName || booking.expertName || '고수 정보 없음'}
            </p>
          </div>
        </div>

        <section className="panel booking-detail-section">
          <div className="booking-detail-section-title">
            <PackageCheck size={20} />
            <h2>예약 상품</h2>
          </div>

          <div className="booking-detail-info-list">
            <div className="booking-detail-info-row">
              <span>상품명</span>
              <strong>
                {booking.productTitle || '-'}
              </strong>
            </div>

            <div className="booking-detail-info-row">
              <span>서비스명</span>
              <strong>
                {booking.serviceTitle || '-'}
              </strong>
            </div>

            <div className="booking-detail-info-row">
              <span>고수명</span>
              <strong>
                {booking.expertDisplayName || booking.expertName || '-'}
              </strong>
            </div>

            <div className="booking-detail-info-row">
              <span>진행 방식</span>
              <strong>
                {serviceTypeLabel(booking.serviceType)}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel booking-detail-section">
          <div className="booking-detail-section-title">
            <CalendarDays size={20} />
            <h2>일정 정보</h2>
          </div>

          <div className="booking-detail-schedule-card">
            <div>
              <span>예약 날짜</span>
              <strong>{formatDate(booking.startAt)}</strong>
            </div>

            <div>
              <span>예약 시간</span>
              <strong>
                {formatTime(booking.startAt)}
                {' '}
                -
                {' '}
                {formatTime(booking.endAt)}
              </strong>
            </div>
          </div>

          <div className="booking-detail-location">
            <MapPin size={18} />

            <span>
              {booking.locationName || booking.locationText || '지역 미정'}
            </span>
          </div>
        </section>

        <section className="panel booking-detail-section">
          <div className="booking-detail-section-title">
            <CreditCard size={20} />
            <h2>결제 정보</h2>
          </div>

          <div className="booking-detail-payment-box">
            <div>
              <span>결제 상태</span>
              <strong>
                {status === 'CONFIRMED' ? '결제 완료' : bookingStatusLabel(status)}
              </strong>
            </div>

            <div>
              <span>결제 금액</span>
              <strong>
                {amount !== null
                  ? `${Number(amount).toLocaleString()}원`
                  : '결제 금액 정보 없음'}
              </strong>
            </div>
          </div>
        </section>

        <div className="booking-detail-actions">
          <Link to="/mypage" className="btn btn-primary">
            마이페이지로 돌아가기
          </Link>

          <Link to="/market" className="btn btn-ghost">
            마켓 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}