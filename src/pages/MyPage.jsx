import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  CalendarDays,
  Bookmark,
  PenLine,
  UserRound,
  UserX,
  Ticket,
  ShieldCheck
} from 'lucide-react';

import {
  api,
  getStoredUser,
  updateStoredUser,
  clearAuth
} from '../api/client';

import {
  Page,
  Stat,
  Input
} from '../components/common';

const formatBookingDateTime = (value) => {
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
};

const bookingStatusLabel = (status) => {
  if (status === 'CONFIRMED') return '예약 확정';
  if (status === 'PENDING_PAYMENT') return '결제 대기';
  if (status === 'EXPIRED') return '만료';
  if (status === 'CANCELED') return '취소';
  return status || '-';
};

export default function MyPage() {
  const [userInfo, setUserInfo] = useState(getStoredUser() || {});
  const [summary, setSummary] = useState(null);
  const [favoriteExperts, setFavoriteExperts] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    phone: '',
    detailAddress: '',
    profileImageUrl: ''
  });
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingMsg, setBookingMsg] = useState('');
  
  const [coupons, setCoupons] = useState([]);

  const location = useLocation();
  const favoriteCount = favoriteExperts.length;

  const extractResult = res => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.result)) return res.result;
    if (Array.isArray(res?.data?.result)) return res.data.result;
    return [];
  };

  const loadFavorites = async () => {
    const res = await api.get('/api/mypage/favorites');
    setFavoriteExperts(extractResult(res));
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/api/bookings/me');
      const list = Array.isArray(res?.result) ? res.result : res?.result?.content || [];
      setBookings(list);
    } catch (err) {
      setBookingMsg(err.message || '예약 내역을 불러오지 못했습니다.');
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await api.get('/api/coupons/me');
      const list = Array.isArray(res?.result) ? res.result : res?.result?.content || [];
      setCoupons(list);
    } catch (err) {
      setCoupons([]);
    }
  };

  useEffect(() => {
    api.get('/api/users/me')
      .then(res => {
        const data = res?.result || res?.data?.result || res;
        setUserInfo(data);
        setForm({
          name: data.name || '',
          nickname: data.nickname || '',
          phone: data.phone || '',
          detailAddress: data.detailAddress || '',
          profileImageUrl: data.profileImageUrl || '',
        });
        updateStoredUser(data);

        if (data.role !== 'EXPERT') {
          api.get('/api/payments/me')
            .then(res => {
              const list = Array.isArray(res?.result) ? res.result : res?.result?.content || [];
              setPayments(list);
            })
            .catch(() => {
              setPayments([]);
            });

          loadCoupons();
        }
      })
      .catch(() => {});

    api.get('/api/mypage')
      .then(res => setSummary(res?.result || res?.data?.result || res))
      .catch(() => {});

    loadFavorites().catch(() => setFavoriteExperts([]));
    loadBookings();
  }, []);

  const toggleFavoriteList = async () => {
    setMsg('');
    if (showFavorites) {
      setShowFavorites(false);
      return;
    }
    try {
      await loadFavorites();
      setShowFavorites(true);
    } catch {
      setFavoriteExperts([]);
      setShowFavorites(true);
      setMsg('찜한 고수 목록을 불러오지 못했습니다.');
    }
  };

  const updateProfile = async e => {
    e.preventDefault();

    setMsg('');
    setProfileMsg('');

    const profilePayload = {
      name: form.name,
      nickname: form.nickname,
      phone: form.phone,
      detailAddress: form.detailAddress,
      profileImageUrl: form.profileImageUrl
    };

    try {
      const res = await api.patch('/api/users/me', profilePayload);
      const data = res?.result || res?.data?.result || res;

      setUserInfo(data);
      updateStoredUser(data);

      setForm({
        name: data.name || '',
        nickname: data.nickname || '',
        phone: data.phone || '',
        detailAddress: data.detailAddress || '',
        profileImageUrl: data.profileImageUrl || ''
      });

      setProfileMsg('프로필이 수정되었습니다.');
      setIsProfileEditOpen(false);
    } catch (err) {
      setProfileMsg(err.message || '프로필 수정에 실패했습니다.');
    }
  };

  const withdraw = async e => {
    e.preventDefault();
    if (!confirm('정말 회원탈퇴를 진행하시겠습니까?')) return;
    try {
      await api.delete('/api/users/me', { password: withdrawPassword });
      clearAuth();
      alert('회원탈퇴가 완료되었습니다.');
      window.location.href = '/';
    } catch (err) {
      setMsg(err.message);
    }
  };

  const downloadWelcomeCoupon = async () => {
    try {
      await api.post('/api/coupons/welcome');
      const updatedUser = { ...userInfo, welcomeCouponAvailable: 'N' };
      setUserInfo(updatedUser);
      updateStoredUser(updatedUser);
      loadCoupons();
      alert('웰컴 쿠폰이 발급되었습니다.');
    } catch (err) {
      alert(err.message || '쿠폰 발급에 실패했습니다.');
    }
  };

  const confirmedBookings = bookings.filter(
    booking => (booking.status || booking.bookingStatus) === 'CONFIRMED'
  );

  return (
    <Page title="마이페이지" desc="내 정보와 요청, 결제 내역을 확인합니다.">

      <div className="mypage-header-action">
        <Link
          className="btn btn-primary"
          to={
            userInfo.expertProfileId
              ? '/expert/register?mode=edit'
              : '/expert/register'
          }
        >
          {userInfo.expertProfileId
            ? '고수 프로필 수정'
            : '고수 활동 시작하기'}
        </Link>
      </div>

      {msg && <p className="message">{msg}</p>}

      {location.state?.paymentCompleted && (
        <div className="mypage-success-banner">
          결제가 완료되었습니다. 예약 내역에서 확인할 수 있습니다.
        </div>
      )}

      <div className="mypage-grid">
        <div className="panel profile-card">
          <div className="avatar large">
            {userInfo.profileImageUrl ? (
              <img src={userInfo.profileImageUrl} alt="프로필" className="profile-image" />
            ) : (
              (userInfo.nickname || userInfo.name || 'U').slice(0, 1)
            )}
          </div>
          <h2>{userInfo.nickname || userInfo.name || '사용자'}</h2>
          <p>{userInfo.email || '로그인 후 이용 정보를 확인할 수 있습니다.'}</p>
          <Link className="btn btn-ghost full" to="/requests">내 요청 보기</Link>
        </div>

        <div className="stats-grid">
          <Stat icon={<CalendarDays />} value={summary?.inProgressCount ?? 0} label="진행중" />
          <button type="button" className="card stat-card stat-button" onClick={toggleFavoriteList}>
            <span><Bookmark size={22} /></span>
            <b>{favoriteCount}</b>
            <small>찜한 고수</small>
          </button>
          <Stat icon={<PenLine />} value={summary?.postCount ?? 0} label="작성글" />
        </div>
      </div>

      {showFavorites && (
        <section className="panel favorite-panel">
          <div className="card-row">
            <h2>찜한 고수</h2>
            <button type="button" className="btn btn-ghost" onClick={() => setShowFavorites(false)}>닫기</button>
          </div>
          <div className="expert-grid market-list-spacer">
            {favoriteExperts.length ? (
              favoriteExperts.map((expert, i) => {
                const expertId = expert.expertProfileId || expert.expertId || expert.id;
                const name = expert.displayName || expert.expertName || expert.name || expert.nickname || '고수';
                return (
                  <Link className="card" to={`/experts/${expertId}`} key={expertId || i}>
                    <div className="card-row">
                      <div className="avatar">{name.slice(0, 1)}</div>
                      <span className="badge">찜한 고수</span>
                    </div>
                    <h3>{name}</h3>
                    <p>{expert.introduction || expert.description || '고수 정보를 확인해보세요.'}</p>
                    <div className="meta">
                      <span>★ {expert.rating || '0.0'}</span>
                      <span>{expert.categoryName || expert.category || expert.mainCategoryName || '서비스'}</span>
                      <span>{expert.region || expert.location || expert.mainLocationName || '지역 협의'}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="muted">찜한 고수가 없습니다.</p>
            )}
          </div>
        </section>
      )}

      <div className="mypage-sections">

        <section className="panel mypage-booking-section">
          <h2><CalendarDays size={20} /> 예약 내역</h2>
          {bookingMsg && <p className="error-text">{bookingMsg}</p>}
          {!bookingMsg && confirmedBookings.length === 0 && (
            <p className="muted">결제 완료된 예약 내역이 없습니다.</p>
          )}
          <div className="mypage-booking-list">
            {confirmedBookings.map((booking) => (
              <Link key={booking.bookingId} to={`/bookings/${booking.bookingId}`} className="mypage-booking-card">
                <div>
                  <strong>{booking.productTitle || booking.serviceTitle || '예약 상품'}</strong>
                  <p>{formatBookingDateTime(booking.startAt)} {' ~ '} {formatBookingDateTime(booking.endAt)}</p>
                  <p>{booking.locationName || booking.locationText || '지역 미정'}</p>
                </div>
                <span className="mypage-booking-status">
                  {bookingStatusLabel(booking.status || booking.bookingStatus)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {userInfo.role !== 'EXPERT' && (
          <section className="panel">
            <h2>결제 내역</h2>
            {payments.length === 0 ? (
              <p className="muted">결제 내역이 없습니다.</p>
            ) : (
              <div className="payment-history-list">
                {payments.map(payment => (
                  <div key={payment.paymentId} className="payment-history-card">
                    <div>
                      <h3>{payment.orderName}</h3>
                      <p className="muted">주문번호: {payment.orderId}</p>
                    </div>
                    <div className="payment-history-right">
                      <b>{Number(payment.paymentAmount).toLocaleString()}원</b>
                      <span className="payment-status">{payment.paymentStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="panel profile-edit-panel">
          <div className="profile-edit-head">
            <div>
              <h2><UserRound size={20} /> 내 프로필</h2>
              <p className="muted">기본 회원 정보를 확인하고 수정할 수 있습니다.</p>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setProfileMsg('');
                setIsProfileEditOpen(prev => !prev);
              }}
            >
              {isProfileEditOpen ? '닫기' : '수정하기'}
            </button>
          </div>

          {profileMsg && (
            <div className="profile-save-message">
              {profileMsg}
            </div>
          )}

          {!isProfileEditOpen ? (
            <div className="profile-summary-list">
              <div className="profile-summary-row">
                <span>이름</span>
                <strong>{userInfo.name || '-'}</strong>
              </div>

              <div className="profile-summary-row">
                <span>닉네임</span>
                <strong>{userInfo.nickname || '-'}</strong>
              </div>

              <div className="profile-summary-row">
                <span>전화번호</span>
                <strong>{userInfo.phone || '-'}</strong>
              </div>

              <div className="profile-summary-row">
                <span>상세주소</span>
                <strong>{userInfo.detailAddress || '-'}</strong>
              </div>
            </div>
          ) : (
            <form className="form" onSubmit={updateProfile}>
              <Input
                label="이름"
                value={form.name}
                onChange={v => setForm({ ...form, name: v })}
              />

              <Input
                label="닉네임"
                value={form.nickname}
                onChange={v => setForm({ ...form, nickname: v })}
              />

              <Input
                label="전화번호"
                value={form.phone}
                onChange={v => setForm({ ...form, phone: v })}
              />

              <Input
                label="상세주소"
                value={form.detailAddress}
                onChange={v => setForm({ ...form, detailAddress: v })}
              />

              <Input
                label="프로필 이미지 URL"
                value={form.profileImageUrl}
                onChange={v => setForm({ ...form, profileImageUrl: v })}
              />

              <button className="btn btn-primary">프로필 저장</button>
            </form>
          )}
        </section>

        <section className="panel">
          <h2><ShieldCheck size={20} /> 보안 설정</h2>
          <div className="card-row" style={{ alignItems: 'center' }}>
            <div>
              <h3>결제 비밀번호</h3>
              <p className="muted">안전한 결제를 위해 6자리 E2E 암호화 결제 비밀번호를 설정합니다.</p>
            </div>
            <Link className="btn btn-primary" to="/mypage/payment-password">
              비밀번호 설정
            </Link>
          </div>
        </section>

        <section className="panel danger-panel">
          <h2><UserX size={20} /> 회원탈퇴</h2>
          <p className="muted">회원탈퇴 시 계정 상태가 탈퇴 처리되며, 다시 로그인할 수 없습니다.</p>
          <form className="form" onSubmit={withdraw}>
            <Input label="비밀번호 확인" type="password" value={withdrawPassword} onChange={setWithdrawPassword} />
            <button className="btn btn-ghost danger">회원탈퇴</button>
          </form>
        </section>
      </div>
    </Page>
  );
}