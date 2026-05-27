import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateId(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateId) {
  if (!dateId) return '';

  const [year, month, day] = dateId.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = dayNames[date.getDay()];

  return `${year}년 ${String(month).padStart(2, '0')}월 ${String(day).padStart(2, '0')}일 (${dayName})`;
}

function serviceTypeLabel(type) {
  if (type === 'ONLINE') return '온라인';
  if (type === 'OFFLINE') return '대면';
  if (type === 'BOTH') return '온라인/대면';
  return type || '-';
}

function getLocationLabel(product) {
  if (!product) return '-';

  if (product.serviceType === 'ONLINE') {
    return '온라인';
  }

  return product.locationName || product.mainLocationName || '지역 미정';
}

export default function StoreProductDetail() {
  const { storeProductId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [msg, setMsg] = useState('');

  const [selectedOption, setSelectedOption] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDateId(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [dateWindowStart, setDateWindowStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [activeDetailTab, setActiveDetailTab] = useState('DETAIL');
  const [isPreparingBooking, setIsPreparingBooking] = useState(false);

  const timeOptions = [
    '오전 9:00',
    '오전 10:00',
    '오전 11:00',
    '오후 12:00',
    '오후 1:00',
    '오후 2:00',
    '오후 3:00',
    '오후 4:00',
    '오후 5:00',
    '오후 6:00',
    '오후 7:00',
    '오후 8:00',
    '오후 9:00',
    '오후 10:00',
    '오후 11:00'
  ];

  const dateOptions = useMemo(() => {
    const todayId = formatDateId(new Date());

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(dateWindowStart);
      date.setDate(dateWindowStart.getDate() + index);
      date.setHours(0, 0, 0, 0);

      const id = formatDateId(date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayName = dayNames[date.getDay()];

      return {
        id,
        month,
        day,
        dayName: id === todayId ? '오늘' : dayName,
        label: formatDateLabel(id)
      };
    });
  }, [dateWindowStart]);

  const dateWindowTitle = useMemo(() => {
    const start = dateOptions[0];
    const end = dateOptions[dateOptions.length - 1];

    if (!start || !end) return '';

    if (start.month === end.month) {
      return `${start.month}월 예약 가능 날짜`;
    }

    return `${start.month}월 - ${end.month}월 예약 가능 날짜`;
  }, [dateOptions]);

  const canMovePrev = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dateWindowStart > today;
  }, [dateWindowStart]);

  const moveDateWindow = (amount) => {
    setDateWindowStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + amount);
      next.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (next < today) {
        return today;
      }

      return next;
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const load = async () => {
      try {
        const res = await api.get(`/api/store-products/${storeProductId}`);
        setProduct(res.result);
        setSelectedOption(String(storeProductId));
      } catch (err) {
        setMsg(err.message || '상품 정보를 불러오지 못했습니다.');
      }
    };

    load();
  }, [storeProductId]);

  const toLocalDateTimeString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  };

  const parseSelectedDateTime = (dateId, timeText) => {
    const [year, month, day] = dateId.split('-').map(Number);

    const rawTime = timeText
      .replace('오전 ', '')
      .replace('오후 ', '');

    const [hourText, minuteText] = rawTime.split(':');

    let hour = Number(hourText);
    const minute = Number(minuteText || 0);

    if (timeText.includes('오후') && hour !== 12) {
      hour += 12;
    }

    if (timeText.includes('오전') && hour === 12) {
      hour = 0;
    }

    const start = new Date(year, month - 1, day, hour, minute, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    return {
      start,
      end,
      startAt: toLocalDateTimeString(start),
      endAt: toLocalDateTimeString(end)
    };
  };

  const isPastTimeOption = (timeText) => {
    if (!selectedDate || !timeText) {
      return false;
    }

    const { start } = parseSelectedDateTime(selectedDate, timeText);

    return start.getTime() <= Date.now();
  };

  useEffect(() => {
    if (!selectedTime) return;

    if (isPastTimeOption(selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime]);

  const handleReserve = async () => {
    if (isPreparingBooking) return;

    if (!selectedOption) {
      alert('상품을 선택해주세요.');
      return;
    }

    if (!selectedDate) {
      alert('예약 날짜를 선택해주세요.');
      return;
    }

    if (!selectedTime) {
      alert('예약 시간을 선택해주세요.');
      return;
    }

    const { start, startAt, endAt } = parseSelectedDateTime(
      selectedDate,
      selectedTime
    );

    if (start.getTime() <= Date.now()) {
      alert('이미 지난 시간입니다. 다른 시간을 선택해주세요.');
      return;
    }

    try {
      setIsPreparingBooking(true);

      const locationId =
        product.locationId ??
        product.mainLocationId ??
        product.serviceLocationId;

      const preparePayload = {
        storeProductId: Number(storeProductId),
        startAt,
        endAt,
        locationText: getLocationLabel(product)
      };

      if (product.serviceType !== 'ONLINE' && locationId) {
        preparePayload.locationId = Number(locationId);
      }

      const res = await api.post(
        '/api/bookings/prepare',
        preparePayload
      );

      const bookingId = res.result?.bookingId;

      if (!bookingId) {
        alert('예약 번호를 확인할 수 없습니다.');
        return;
      }

      navigate(`/store-products/${storeProductId}/checkout/${bookingId}`);
    } catch (err) {
      if (
        err.code === 'BOOKING_409_1' ||
        err.message?.includes('이미 예약된 시간')
      ) {
        alert('이미 예약된 시간입니다. 다른 시간대를 선택해주세요.');
        return;
      }

      alert(err.message || '예약 생성에 실패했습니다.');
    } finally {
      setIsPreparingBooking(false);
    }
  };

  if (msg) {
    return (
      <section className="container page">
        <div className="panel">
          <p className="error-text">{msg}</p>
          <Link to="/market" className="btn">마켓으로 돌아가기</Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container page">
        <div className="panel">
          <p className="muted">상품 정보를 불러오는 중입니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container page store-detail-page">
      <div className="store-detail-layout">
        <div className="store-detail-main">
          <div className="panel store-detail-left-card">
            <div className="store-detail-image-area">
              {product.thumbnailImageUrl ? (
                <img
                  src={product.thumbnailImageUrl}
                  alt={product.title}
                  className="store-detail-image"
                />
              ) : (
                <div className="store-detail-image empty">
                  이미지 없음
                </div>
              )}
            </div>

            <div className="store-detail-title-area">
              <span className="badge">
                {product.categoryName || '마켓 상품'}
              </span>

              <h1>{product.title}</h1>

              <p className="muted">
                {serviceTypeLabel(product.serviceType)} · {getLocationLabel(product)}
              </p>
            </div>

            <div className="store-detail-tabs">
              <button
                type="button"
                className={activeDetailTab === 'DETAIL' ? 'active' : ''}
                onClick={() => setActiveDetailTab('DETAIL')}
              >
                상세 설명
              </button>

              <button
                type="button"
                className={activeDetailTab === 'EXPERT' ? 'active' : ''}
                onClick={() => setActiveDetailTab('EXPERT')}
              >
                고수 정보
              </button>
            </div>

            <section className="store-detail-tab-content">
              {activeDetailTab === 'DETAIL' && (
                <>
                  <h2>상세 설명</h2>

                  <div className="store-detail-info-lines">
                    <div className="store-detail-info-line">
                      <span>작업 방식</span>
                      <strong>{serviceTypeLabel(product.serviceType)}</strong>
                    </div>

                    <div className="store-detail-info-line">
                      <span>서비스 지역</span>
                      <strong>{getLocationLabel(product)}</strong>
                    </div>
                  </div>

                  <p className="store-detail-description">
                    {product.description || '등록된 상세 설명이 없습니다.'}
                  </p>
                </>
              )}

              {activeDetailTab === 'EXPERT' && (
                <>
                  <h2>고수 정보</h2>

                  {product.expertProfileId ? (
                    <>
                      <p className="muted">
                        이 상품을 등록한 고수의 프로필을 확인할 수 있어요.
                      </p>

                      <Link
                        to={`/experts/${product.expertProfileId}`}
                        className="btn store-expert-profile-btn"
                      >
                        고수 프로필 보기
                      </Link>
                    </>
                  ) : (
                    <p className="muted">
                      연결된 고수 프로필 정보가 없습니다.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>

        <aside className="panel store-booking-panel">
          <div className="store-category-path">
            {product.categoryName || '마켓'} &gt; {serviceTypeLabel(product.serviceType)}
          </div>

          <h2 className="store-booking-title">
            {product.title}
          </h2>

          <select
            className="store-option-select"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="">상품을 선택해주세요</option>
            <option value={String(storeProductId)}>
              {product.title} ({Number(product.price || 0).toLocaleString()}원)
            </option>
          </select>

          <div className="store-date-picker-head">
            <button
              type="button"
              onClick={() => moveDateWindow(-7)}
              disabled={!canMovePrev}
            >
              ‹
            </button>

            <strong>{dateWindowTitle}</strong>

            <button
              type="button"
              onClick={() => moveDateWindow(7)}
            >
              ›
            </button>
          </div>

          <div className="store-date-row">
            {dateOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  selectedDate === item.id
                    ? 'store-date-item active'
                    : 'store-date-item'
                }
                onClick={() => setSelectedDate(item.id)}
              >
                <span>{item.dayName}</span>
                <strong>{item.day}</strong>
              </button>
            ))}
          </div>

          <div className="store-time-grid">
            {timeOptions.map((time) => {
              const disabled = isPastTimeOption(time);

              return (
                <button
                  key={time}
                  type="button"
                  disabled={disabled}
                  className={[
                    'store-time-item',
                    selectedTime === time ? 'active' : '',
                    disabled ? 'disabled' : ''
                  ].join(' ')}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedTime(time);
                  }}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="store-reserve-button"
            onClick={handleReserve}
            disabled={isPreparingBooking}
          >
            {isPreparingBooking ? '예약 준비 중...' : '예약하기'}
          </button>

          <Link to="/market" className="market-back-link">
            마켓으로 돌아가기
          </Link>
        </aside>
      </div>
    </section>
  );
}