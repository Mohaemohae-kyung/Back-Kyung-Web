import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';

import { Page } from '../components/common';
import { api } from '../api/client';

export default function Chat() {

  const navigate = useNavigate();

  const { roomId } = useParams();

  const currentRoomId =
    Number(roomId);

  const [rooms, setRooms] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState('');

  // ❌ connected state 제거 — ref로 대체
  const messagesRef =
    useRef(null);

  const clientRef =
    useRef(null);

  const subscriptionRef =
    useRef(null);

  const notifySubscriptionRef =
    useRef(null);

  const currentRoomIdRef =
    useRef(currentRoomId);

  // 메시지 수신 핸들러를 ref로 관리 (클로저 문제 방지)
  const onMessageRef =
    useRef(null);

  const token =
    localStorage.getItem('accessToken');

  let loginUserId = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      loginUserId = Number(decoded.sub);
    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // 현재 room ref 동기화
  // =========================
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  // =========================
  // 메시지 수신 핸들러 ref 동기화
  // (roomId가 바뀌어도 항상 최신 setMessages 참조)
  // =========================
  useEffect(() => {
    onMessageRef.current = (message) => {
      const newMessage = JSON.parse(message.body);
      console.log('실시간 메시지 수신', newMessage);

      setMessages(prev => [...prev, newMessage]);

      setRooms(prev =>
        prev.map(room => {
          if (Number(room.chatRoomId) === Number(currentRoomIdRef.current)) {
            return { ...room, unreadCount: 0 };
          }
          return room;
        })
      );
    };
  });

  // =========================
  // 채팅방 목록 조회
  // =========================
  const loadRooms = async () => {
    try {
      const res = await api.get('/api/chat/rooms');
      setRooms(res.result || res || []);
    } catch (err) {
      console.error('채팅방 조회 실패', err);
    }
  };

  // =========================
  // 메시지 조회
  // =========================
  const loadMessages = async () => {
    try {
      setMessages([]);
      const res = await api.get(`/api/chat/rooms/${currentRoomId}/messages`);
      setMessages(res.result || res || []);
    } catch (err) {
      console.error('메시지 조회 실패', err);
    }
  };

  // =========================
  // room 구독 함수 (재사용)
  // =========================
  const subscribeToRoom = (client, roomId) => {
    // 기존 구독 해제
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (!roomId) return;

    console.log('구독 시도:', `/sub/chat/room/${roomId}`);

    subscriptionRef.current = client.subscribe(
      `/sub/chat/room/${roomId}`,
      (message) => {
        // ref를 통해 항상 최신 핸들러 호출
        onMessageRef.current?.(message);
      }
    );

    console.log('구독 완료:', `/sub/chat/room/${roomId}`);
  };

  // =========================
  // websocket 연결 (최초 1회)
  // =========================
  useEffect(() => {

    const client = new Client({
      webSocketFactory: () =>
        new SockJS('http://localhost:8080/ws-stomp'),

      reconnectDelay: 5000,

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      onConnect: () => {
        console.log('웹소켓 연결 성공');

        // ✅ 연결 즉시 현재 roomId로 구독
        subscribeToRoom(client, currentRoomIdRef.current);

        // ✅ 알림 구독
        notifySubscriptionRef.current = client.subscribe(
          `/sub/chat/notify/${loginUserId}`,
          message => {
            const notify = JSON.parse(message.body);
            console.log('알림 수신', notify);

            if (Number(notify.roomId) === Number(currentRoomIdRef.current)) {
              return;
            }

            setRooms(prev =>
              prev.map(room => {
                if (Number(room.chatRoomId) === Number(notify.roomId)) {
                  return { ...room, unreadCount: (room.unreadCount || 0) + 1 };
                }
                return room;
              })
            );
          }
        );
      },

      onDisconnect: () => {
        console.log('웹소켓 연결 종료');
      },

      onStompError: frame => {
        console.error('STOMP ERROR', frame);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      notifySubscriptionRef.current?.unsubscribe();
      client.deactivate();
    };

  }, []);

  // =========================
  // 채팅방 목록 최초 조회
  // =========================
  useEffect(() => {
    loadRooms();
  }, []);

  // =========================
  // room 변경 시: 메시지 조회 + 재구독
  // =========================
  useEffect(() => {
    if (!currentRoomId) return;

    loadMessages();

    // ✅ 이미 연결된 상태면 즉시 재구독
    // (연결 전이면 onConnect에서 처리)
    if (clientRef.current?.connected) {
      subscribeToRoom(clientRef.current, currentRoomId);
    }

  }, [currentRoomId]);

  // =========================
  // 채팅방 읽음 처리
  // =========================
  useEffect(() => {
    if (!currentRoomId) return;

    api.patch(`/api/chat/rooms/${currentRoomId}/read`)
      .then(() => {
        setRooms(prev =>
          prev.map(room => {
            if (Number(room.chatRoomId) === Number(currentRoomId)) {
              return { ...room, unreadCount: 0 };
            }
            return room;
          })
        );
      })
      .catch(console.error);

  }, [currentRoomId]);

  // =========================
  // 메시지 전송
  // =========================
  const send = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    if (!clientRef.current?.connected) {
      alert('웹소켓 연결 안됨');
      return;
    }

    clientRef.current.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify({
        roomId: currentRoomId,
        senderId: loginUserId,
        type: 'TEXT',
        message: text
      })
    });

    // ✅ 낙관적 업데이트 제거
    // 서버 브로드캐스트 → 구독 콜백 → setMessages 로 처리

    setText('');
  };

  // =========================
  // 스크롤
  // =========================
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop =
        messagesRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Page
      title="채팅"
      desc="고수와 견적, 일정, 진행 방식을 조율하세요."
    >
      <div className="chat-layout">

        {/* 채팅방 목록 */}
        <aside className="panel chat-list">
          <h2>대화 목록</h2>
          {rooms.map(room => {
            const isActive = currentRoomId === Number(room.chatRoomId);
            const unreadCount = room.unreadCount || 0;

            return (
              <div
                key={room.chatRoomId}
                className={`chat-user ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => navigate(`/chat/${room.chatRoomId}`)}
              >
                <div className="chat-user-top">
                  <b>{room.roomName || `상담 #${room.chatRoomId}`}</b>
                  {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </aside>

        {/* 채팅 */}
        <section
          key={currentRoomId}
          className="panel chat-room"
        >
          <div className="chat-room-header">
            {rooms.find(r => Number(r.chatRoomId) === Number(currentRoomId))?.roomName}
          </div>

          <div className="messages" ref={messagesRef}>
            {messages.map(message => (
              <div
                key={message.chatMessageId}
                className={`bubble ${
                  Number(message.senderId) === Number(loginUserId)
                    ? 'me'
                    : 'other'
                }`}
              >
                {message.content ?? message.message}
              </div>
            ))}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="메시지를 입력하세요"
            />
            <button className="btn btn-primary">
              <Send size={16} />
              전송
            </button>
          </form>
        </section>

      </div>
    </Page>
  );
}
