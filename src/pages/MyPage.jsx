import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Bookmark, PenLine, UserRound, UserX } from 'lucide-react';
import { api, getStoredUser, updateStoredUser, clearAuth } from '../api/client';
import { Page, Stat, Input } from '../components/common';

export default function MyPage() {
  const [userInfo, setUserInfo] = useState(getStoredUser() || {});
  const [summary, setSummary] = useState(null);
  const [favoriteExperts, setFavoriteExperts] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', phone: '', profileImageUrl: '' });
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [payments, setPayments] = useState([]);

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

  useEffect(() => {
    api.get('/api/users/me').then(res => {
      const data = res?.result || res?.data?.result || res;
      setUserInfo(data);
      setForm({
        name: data.name || '',
        nickname: data.nickname || '',
        phone: data.phone || '',
        profileImageUrl: data.profileImageUrl || '',
      });
      updateStoredUser(data);
    }).catch(() => {});

    api.get('/api/mypage')
      .then(res => setSummary(res?.result || res?.data?.result || res))
      .catch(() => {});

    loadFavorites().catch(() => setFavoriteExperts([]));

      api.get('/api/payments/me')
        .then(res => {

          setPayments(
            res?.result ||
            res?.data?.result ||
            res ||
            []
          );

        })
        .catch(() => {
          setPayments([]);
        });
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
      setMsg('찜한 고수 목록을 불러오지 못했어요.');
    }
  };

  const updateProfile = async e => {
    e.preventDefault();
    setMsg('');

    try {
      const res = await api.patch('/api/users/me', form);
      const data = res?.result || res?.data?.result || res;
      setUserInfo(data);
      updateStoredUser(data);
      setMsg('프로필이 수정되었습니다.');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const withdraw = async e => {
    e.preventDefault();

    if (!confirm('정말 회원탈퇴를 진행할까요?')) return;

    try {
      await api.delete('/api/users/me', { password: withdrawPassword });
      clearAuth();
      alert('회원탈퇴가 완료되었습니다.');
      window.location.href = '/';
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <Page title="마이페이지" desc="내 정보와 요청, 결제 내역을 한 번에 확인합니다.">
      {msg && <p className="message">{msg}</p>}

      <div className="mypage-grid">
        <div className="panel profile-card">
          <div className="avatar large">

            {userInfo.profileImageUrl ? (
              <img
                src={userInfo.profileImageUrl}
                alt="프로필"
                className="profile-image"
              />
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
            <button type="button" className="btn btn-ghost" onClick={() => setShowFavorites(false)}>
              닫기
            </button>
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
              <p className="muted">아직 찜한 고수가 없어요.</p>
            )}
          </div>
        </section>
      )}

      <div className="mypage-sections">
        <section className="panel">

          <h2>결제 내역</h2>

          {
            payments.length === 0 ? (

              <p className="muted">
                아직 결제 내역이 없어요.
              </p>

            ) : (

              <div className="payment-history-list">

                {payments.map(payment => (

                  <div
                    key={payment.paymentId}
                    className="payment-history-card"
                  >

                    <div>

                      <h3>
                        {payment.orderName}
                      </h3>

                      <p className="muted">
                        주문번호:
                        {' '}
                        {payment.orderId}
                      </p>

                    </div>

                    <div className="payment-history-right">

                      <b>
                        {Number(payment.paymentAmount)
                          .toLocaleString()}원
                      </b>

                      <span className="payment-status">
                        {payment.status}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            )
          }

        </section>

        <section className="panel expert-banner">
          <div>
            <h2>고수로 활동하고 싶나요?</h2>
            <p>전문가 프로필을 등록하면 고객에게 견적 요청을 받을 수 있습니다.</p>
          </div>
          <Link className="btn btn-primary" to="/expert/register">고수 활동 시작하기</Link>
        </section>

        <section className="panel">
          <h2><UserRound size={20} /> 내 프로필 수정</h2>
          <form className="form" onSubmit={updateProfile}>
            <Input label="이름" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Input label="닉네임" value={form.nickname} onChange={v => setForm({ ...form, nickname: v })} />
            <Input label="전화번호" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
            <Input label="프로필 이미지 URL" value={form.profileImageUrl} onChange={v => setForm({ ...form, profileImageUrl: v })} />
            <button className="btn btn-primary">프로필 저장</button>
          </form>
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