import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ChatSocketContext =
  createContext(null);

export function ChatSocketProvider({
  children
}) {

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
  // 방별 unread 카운트
  // { roomId: count }
  // =========================
  const [unreadMap, setUnreadMap] =
    useState({});

  const clientRef = useRef(null);
  const currentRoomIdRef = useRef(null);

  // =========================
  // 현재 보고있는 방 설정
  // (Chat.jsx에서 호출)
  // =========================
  const setCurrentRoom = (roomId) => {
    currentRoomIdRef.current = roomId;

    // 입장하면 해당 방 unread 제거
    if (roomId) {
      setUnreadMap(prev => ({
        ...prev,
        [roomId]: 0
      }));
    }
  };

  // =========================
  // 전체 unread 수
  // =========================
  const totalUnread =
    Object.values(unreadMap)
      .reduce((sum, n) => sum + (n || 0), 0);

  // =========================
  // WebSocket 연결 (앱 전역 1회)
  // =========================
  useEffect(() => {

    if (!token || !loginUserId) return;

    const client = new Client({

      webSocketFactory: () =>
        new SockJS(`${API_BASE_URL}/ws-stomp`),

      reconnectDelay: 5000,

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      onConnect: () => {
        console.log('[전역] 웹소켓 연결 성공');

        // =========================
        // 알림 구독
        // =========================
        client.subscribe(
          `/sub/chat/notify/${loginUserId}`,
          message => {
            const notify =
              JSON.parse(message.body);

            console.log('[전역] 알림 수신', notify);

            // 현재 보고있는 방이면 무시
            if (
              Number(notify.roomId) ===
              Number(currentRoomIdRef.current)
            ) {
              return;
            }

            // unread 증가
            setUnreadMap(prev => ({
              ...prev,
              [notify.roomId]:
                (prev[notify.roomId] || 0) + 1
            }));
          }
        );
      },

      onDisconnect: () => {
        console.log('[전역] 웹소켓 연결 종료');
      },

      onStompError: frame => {
        console.error('[전역] STOMP ERROR', frame);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };

  }, [token, loginUserId]);

  return (
    <ChatSocketContext.Provider
      value={{
        clientRef,
        unreadMap,
        setUnreadMap,
        setCurrentRoom,
        totalUnread
      }}
    >
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  return useContext(ChatSocketContext);
}