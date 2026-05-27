import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useChatSocket } from '../components/ChatSocketContext';

import { api, getStoredUser }
  from '../api/client';

import { Page }
  from '../components/common';

export default function Requests() {

  const navigate = useNavigate();

  const [items, setItems] =
    useState([]);

  const [msg, setMsg] =
    useState('');

  // =========================
  // 전역 WebSocket Context
  // =========================
  const { unreadMap, setUnreadMap } =
    useChatSocket();

  const token =
    localStorage.getItem('accessToken');

  const user =
    getStoredUser();

  const isExpert =
    user?.role === 'EXPERT';

  // =========================
  // 요청 목록 조회
  // =========================
  useEffect(() => {

    if (!token) return;

    const endpoint =

      isExpert

        ? '/api/service-requests/received'

        : '/api/service-requests/me';

    console.log('현재 사용자 ROLE = ', user?.role);
    console.log('호출 API = ', endpoint);

    api.get(endpoint)

      .then(res => {

        console.log('요청 조회 성공', res);

        const list =

          res?.result ||

          res?.data?.result ||

          res?.data ||

          [];

        console.log('최종 리스트 = ', list);

        setItems(
          Array.isArray(list) ? list : []
        );

        setMsg('');
      })

      .catch(err => {

        console.error('요청 조회 실패', err);

        setItems([]);

        setMsg('요청 내역을 불러오지 못했어요.');
      });

  }, [token, isExpert]);

  // =========================
  // 요청 클릭
  // =========================
  const open = async item => {

    console.log('클릭한 요청 = ', item);

    const canChat =

      item.status === 'CHATTING' ||

      item.status === 'ACCEPTED' ||

      item.status === 'APPROVED' ||

      item.status === 'COMPLETED' ||

      item.accepted ||

      item.status === '수락됨';

    if (canChat) {

      navigate(`/requests/${item.requestId || item.id}`);

      return;
    }

    // =========================
    // 고수 : 받은 요청 상세
    // =========================
    if (isExpert) {

      navigate(`/requests/${item.requestId || item.id}`);

      return;
    }

    // =========================
    // 거절 상태
    // =========================
    if (
      item.status === 'REJECTED' ||
      item.status === '거절됨'
    ) {

      alert('고수가 요청을 거절했습니다.');

      return;
    }

    // =========================
    // 검토중
    // =========================
    alert(
      '고수가 아직 요청을 검토 중입니다. 수락되면 채팅으로 이동할 수 있어요.'
    );
  };

  // =========================
  // 비로그인
  // =========================
  if (!token) {

    return (

      <Page
        title="요청관리"
        desc="로그인 후 요청 내역을 확인할 수 있어요."
      >

        <div className="panel empty-panel">

          <p className="muted">

            요청관리는 로그인 후 이용할 수 있어요.

          </p>

        </div>

      </Page>
    );
  }

  return (

    <Page
      title="요청관리"
      desc={
        isExpert

          ? '고객에게 받은 견적 요청과 진행 상태를 확인합니다.'

          : '내가 보낸 견적 요청과 진행 상태를 확인합니다.'
      }
    >

      {msg && <p className="message">{msg}</p>}

      <div className="request-list">

        {
          items.length > 0 ? (

            items.map((item, i) => {

              // =========================
              // ✅ unreadMap 실시간 값 우선
              // =========================
              const unreadCount =

                unreadMap[item.chatRoomId] ??

                item.unreadCount ??

                0;

              return (

                <button
                  key={item.requestId || item.id || i}

                  className={`request-card ${
                    item.status === 'CHATTING' ||
                    item.status === 'ACCEPTED' ||
                    item.status === 'APPROVED'

                      ? 'accepted'

                      : item.status === 'REJECTED'

                        ? 'rejected'

                        : ''
                  }`}

                  onClick={() => open(item)}
                >

                  <div>

                    <span className="badge">
                      {item.status || '검토중'}
                    </span>

                    <h3>
                      {item.title || item.serviceTitle || '견적 요청'}
                    </h3>

                    <p>

                      {
                        isExpert

                          ? (
                              item.userName ||
                              item.requesterName ||
                              item.name ||
                              '요청 사용자'
                            )

                          : (
                              item.expertName ||
                              item.expertDisplayName ||
                              '고수 확인 중'
                            )
                      }

                      {' · '}

                      {item.categoryName || item.category || '서비스 협의'}

                      {' · '}

                      {
                        item.createdAt

                          ? String(item.createdAt).slice(0, 10)

                          : '최근 요청'
                      }

                    </p>

                    {/* =========================
                        새 메시지 알림
                    ========================= */}
                    {
                      unreadCount > 0 && (

                        <div className="request-alert">
                          새 메시지 {unreadCount}
                        </div>
                      )
                    }

                  </div>

                  <ChevronRight size={20} />

                </button>
              );
            })

          ) : (

            <div className="panel empty-panel">

              <p className="muted">

                {
                  isExpert

                    ? '아직 받은 요청이 없어요.'

                    : '아직 요청 내역이 없어요.'
                }

              </p>

            </div>
          )
        }

      </div>

    </Page>
  );
}