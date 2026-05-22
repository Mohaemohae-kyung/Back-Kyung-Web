import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { Page } from '../components/common';

export default function Requests() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) return;

    api.get('/api/service-requests/me')
      .then(res => setItems(normalizeList(res)))
      .catch(() => {
        setItems([]);
        setMsg('요청 내역을 불러오지 못했어요.');
      });
  }, [token]);

  const open = item => {
    if (item.accepted || item.status === '수락됨' || item.status === 'ACCEPTED' || item.status === 'APPROVED') {
      navigate('/chat');
    } else {
      alert('고수가 아직 요청을 검토 중입니다. 수락되면 채팅으로 이동할 수 있어요.');
    }
  };

  if (!token) {
    return (
      <Page title="요청관리" desc="로그인 후 요청 내역을 확인할 수 있어요.">
        <div className="panel empty-panel">
          <p className="muted">요청관리는 로그인 후 이용할 수 있어요.</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="요청관리" desc="내가 보낸 견적 요청과 진행 상태를 확인합니다.">
      {msg && <p className="message">{msg}</p>}

      <div className="request-list">
        {items.length ? (
          items.map((item, i) => (
            <button
              className={`request-card ${
                item.accepted ||
                item.status === '수락됨' ||
                item.status === 'ACCEPTED' ||
                item.status === 'APPROVED'
                  ? 'accepted'
                  : ''
              }`}
              onClick={() => open(item)}
              key={item.requestId || item.id || i}
            >
              <div>
                <span className="badge">{item.status || '검토중'}</span>
                <h3>{item.title || item.serviceTitle || '견적 요청'}</h3>
                <p>
                  {item.expertName || item.expertDisplayName || '고수 확인 중'} ·{' '}
                  {item.categoryName || item.category || '서비스 협의'} ·{' '}
                  {item.createdAt ? String(item.createdAt).slice(0, 10) : '최근 요청'}
                </p>
              </div>
              <ChevronRight size={20} />
            </button>
          ))
        ) : (
          <div className="panel empty-panel">
            <p className="muted">아직 요청 내역이 없어요.</p>
          </div>
        )}
      </div>
    </Page>
  );
}