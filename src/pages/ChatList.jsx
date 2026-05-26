import {
  useEffect,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import { api }
  from '../api/client';

export default function ChatList() {

  const [rooms, setRooms] =
    useState([]);

  const navigate =
    useNavigate();

  useEffect(() => {

    api.get('/api/chat/rooms')

    .then(res => {

        console.log('채팅방 응답', res);

        setRooms(
            res?.result ||
            res ||
            []
        );
    })

      .catch(err => {
        console.error(err);
      });

  }, []);

  return (

    <div className="container">

      <div className="page-header">
        <h1>채팅 목록</h1>
        <p>
          진행 중인 상담 채팅을
          확인할 수 있습니다.
        </p>
      </div>

      <div className="chat-room-list">

        {rooms.length === 0 && (
          <div className="empty-box">
            채팅방이 없습니다.
          </div>
        )}

        {rooms.map(room => (

          <div
            key={room.chatRoomId}
            className="chat-room-card"
            onClick={() =>
              navigate(
                `/chat/${room.chatRoomId}`
              )
            }
          >

            <div className="chat-room-top">

              <h3>
                {
                  room.requestUserNickname ||
                  '상대방'
                }
              </h3>

              <span>
                {room.updatedAt}
              </span>

            </div>

            <p className="chat-preview">

              {
                room.lastMessage ||
                '메시지가 없습니다.'
              }

            </p>

          </div>

        ))}

      </div>

    </div>
  );
}