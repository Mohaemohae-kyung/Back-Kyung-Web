import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function RequestDetail() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    api.get(`/api/service-requests/${id}`)

      .then(res => {

        console.log('요청 상세 조회 성공', res);

        setItem(
          res?.result ||
          res?.data?.result ||
          res?.data
        );
      })

      .catch(err => {

        console.error(err);

        alert('요청 정보를 불러오지 못했어요.');

        navigate('/requests');
      })

      .finally(() => {

        setLoading(false);
      });

  }, [id, navigate]);

  const approve = async () => {

    try {

      const res = await api.patch(
        `/api/service-requests/${id}/approve`
      );

      alert('요청을 수락했습니다.');

      const result =
        res?.result ||
        res?.data?.result ||
        res?.data;

      const roomId =
        result?.chatRoomId ||
        item?.chatRoomId;

      if (roomId) {

        navigate(`/chat/${roomId}`);

      } else {

        alert('채팅방 정보를 찾을 수 없어요.');
      }

    } catch (err) {

      console.error(err);

      alert('수락 처리에 실패했어요.');
    }
  };

  const reject = async () => {

    try {

      await api.patch(
        `/api/service-requests/${id}/reject`
      );

      alert('요청을 거절했습니다.');

      navigate('/requests');

    } catch (err) {

      console.error(err);

      alert('거절 처리에 실패했어요.');
    }
  };

  if (loading) {

    return (
      <div className="request-detail-page">
        불러오는 중...
      </div>
    );
  }

  if (!item) {

    return (
      <div className="request-detail-page">
        요청 정보가 없습니다.
      </div>
    );
  }

  return (

    <div className="request-detail-page">

      <div className="request-detail-card">

        <div className="request-detail-top">

          <span className="request-status">
            {item.status || 'PENDING'}
          </span>

          <h1>
            {item.title || '견적 요청'}
          </h1>

          <p className="request-user">

            요청자 :
            {' '}

            {
              item.requesterName ||
              item.userName ||
              item.name ||
              '사용자'
            }

          </p>

        </div>

        <div className="request-detail-section">

          <h3>요청 내용</h3>

          <div className="request-content">

            {
              item.content ||
              '내용 없음'
            }

          </div>

        </div>

        <div className="request-detail-grid">

          <div className="detail-box">

            <span>희망 예산</span>

            <strong>
              {
                item.budget
                  ? `${Number(item.budget).toLocaleString()}원`
                  : '협의'
              }
            </strong>

          </div>

          <div className="detail-box">

            <span>희망 일정</span>

            <strong>
              {
                item.preferredDate
                  ? String(item.preferredDate).slice(0, 10)
                  : '미정'
              }
            </strong>

          </div>

        </div>

        {
          item.status !== 'REJECTED' &&
          item.status !== '거절됨' &&

          <div className="request-button-group">

            <button
              className="reject-button"
              onClick={reject}
            >
              거절하기
            </button>

            <button
              className="approve-button"
              onClick={approve}
            >
              수락하기
            </button>

          </div>
        }

      </div>

    </div>
  );
}