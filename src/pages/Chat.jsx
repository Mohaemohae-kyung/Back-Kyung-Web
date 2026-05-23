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

  const [connected, setConnected] =
    useState(false);

  const messagesRef =
    useRef(null);

  const clientRef =
    useRef(null);

  const subscriptionRef =
    useRef(null);

  const notifySubscriptionRef =
    useRef(null);

  // =========================
  // 현재 room 추적용
  // =========================
  const currentRoomIdRef =
    useRef(currentRoomId);

  const token =
    localStorage.getItem(
      'accessToken'
    );

  let loginUserId = null;

  if (token) {

    try {

      const decoded =
        jwtDecode(token);

      loginUserId =
        Number(decoded.sub);

    } catch (err) {

      console.error(err);
    }
  }

  // =========================
  // 현재 room ref 동기화
  // =========================
  useEffect(() => {

    currentRoomIdRef.current =
      currentRoomId;

  }, [currentRoomId]);

  // =========================
  // 채팅방 목록 조회
  // =========================
  const loadRooms = async () => {

    try {

      const res =
        await api.get(
          '/api/chat/rooms'
        );

      const roomList =

        res.result ||

        res ||

        [];

      setRooms(roomList);

    } catch (err) {

      console.error(
        '채팅방 조회 실패',
        err
      );
    }
  };

  // =========================
  // 메시지 조회
  // =========================
  const loadMessages = async () => {

    try {

      setMessages([]);

      const res =
        await api.get(

          `/api/chat/rooms/${currentRoomId}/messages`
        );

      const messageList =

        res.result ||

        res ||

        [];

      setMessages(messageList);

    } catch (err) {

      console.error(
        '메시지 조회 실패',
        err
      );
    }
  };

  // =========================
  // websocket 연결
  // =========================
  useEffect(() => {

    const socket =
      new SockJS(
        'http://localhost:8080/ws-stomp'
      );

    const client =
      new Client({

        webSocketFactory:
          () => socket,

        reconnectDelay: 5000,

        connectHeaders: {

          Authorization:
            `Bearer ${token}`
        },

        onConnect: () => {

          console.log(
            '웹소켓 연결 성공'
          );

          setConnected(true);

          // =========================
          // 전체 알림 subscribe
          // =========================
          notifySubscriptionRef.current =

            client.subscribe(

              `/sub/chat/notify/${loginUserId}`,

              message => {

                const notify =
                  JSON.parse(
                    message.body
                  );

                // =========================
                // 현재 보고있는 방이면 무시
                // =========================
                if (

                  Number(notify.roomId) ===

                  Number(
                    currentRoomIdRef.current
                  )
                ) {

                  return;
                }

                // =========================
                // 다른 방 unread 증가
                // =========================
                setRooms(prev =>

                  prev.map(room => {

                    if (

                      Number(
                        room.chatRoomId
                      ) ===

                      Number(
                        notify.roomId
                      )
                    ) {

                      return {

                        ...room,

                        unreadCount:
                          (
                            room.unreadCount || 0
                          ) + 1
                      };
                    }

                    return room;
                  })
                );
              }
            );
        },

        onDisconnect: () => {

          setConnected(false);
        }
      });

    client.activate();

    clientRef.current = client;

    return () => {

      if (subscriptionRef.current) {

        subscriptionRef.current.unsubscribe();
      }

      if (notifySubscriptionRef.current) {

        notifySubscriptionRef.current.unsubscribe();
      }

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
  // room 변경 시 메시지 조회
  // =========================
  useEffect(() => {

    if (!currentRoomId) {

      return;
    }

    loadMessages();

  }, [currentRoomId]);

  // =========================
  // 채팅방 읽음 처리
  // =========================
  useEffect(() => {

    if (!currentRoomId) return;

    api.patch(

      `/api/chat/rooms/${currentRoomId}/read`
    )

    .then(() => {

      // =========================
      // unreadCount 제거
      // =========================
      setRooms(prev =>

        prev.map(room => {

          if (

            Number(
              room.chatRoomId
            ) ===

            Number(currentRoomId)
          ) {

            return {

              ...room,

              unreadCount: 0
            };
          }

          return room;
        })
      );
    })

    .catch(console.error);

  }, [currentRoomId]);

  // =========================
  // room subscribe
  // =========================
  useEffect(() => {

    if (
      !connected ||
      !currentRoomId
    ) {

      return;
    }

    // =========================
    // 이전 구독 제거
    // =========================
    if (subscriptionRef.current) {

      subscriptionRef.current.unsubscribe();

      subscriptionRef.current = null;
    }

    // =========================
    // 현재 room subscribe
    // =========================
    subscriptionRef.current =

      clientRef.current.subscribe(

        `/sub/chat/room/${currentRoomId}`,

        message => {

          const newMessage =
            JSON.parse(
              message.body
            );

          setMessages(prev => {

            const exists =
              prev.some(
                m =>
                  m.chatMessageId ===
                  newMessage.chatMessageId
              );

            if (exists) {

              return prev;
            }

            return [
              ...prev,
              newMessage
            ];
          });

          // =========================
          // 현재 room unread 제거
          // =========================
          setRooms(prev =>

            prev.map(room => {

              if (

                Number(
                  room.chatRoomId
                ) ===

                Number(currentRoomId)
              ) {

                return {

                  ...room,

                  unreadCount: 0
                };
              }

              return room;
            })
          );
        }
      );

    return () => {

      if (subscriptionRef.current) {

        subscriptionRef.current.unsubscribe();

        subscriptionRef.current = null;
      }
    };

  }, [connected, currentRoomId]);

  // =========================
  // 메시지 전송
  // =========================
  const send = (e) => {

    e.preventDefault();

    if (!text.trim()) return;

    if (

      !clientRef.current ||

      !clientRef.current.connected
    ) {

      alert(
        '웹소켓 연결 안됨'
      );

      return;
    }

    const messageText = text;

    // =========================
    // 내 화면 즉시 추가
    // =========================
    const tempMessage = {

      chatMessageId:
        Date.now(),

      senderId:
        loginUserId,

      content:
        messageText,

      roomId:
        currentRoomId
    };

    setMessages(prev => [

      ...prev,

      tempMessage
    ]);

    // =========================
    // websocket publish
    // =========================
    clientRef.current.publish({

      destination:
        '/pub/chat/message',

      body: JSON.stringify({

        roomId:
          currentRoomId,

        senderId:
          loginUserId,

        type:
          'TEXT',

        message:
          messageText
      })
    });

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

          {
            rooms.map(room => {

              const isActive =

                currentRoomId ===
                Number(room.chatRoomId);

              const unreadCount =

                room.unreadCount || 0;

              return (

                <div
                  key={room.chatRoomId}
                  className={`chat-user ${
                    isActive
                      ? 'active'
                      : ''
                  } ${
                    unreadCount > 0
                      ? 'unread'
                      : ''
                  }`}
                  onClick={() =>
                    navigate(
                      `/chat/${room.chatRoomId}`
                    )
                  }
                >

                  <div className="chat-user-top">

                    <b>

                      {
                        room.roomName ||
                        `상담 #${room.chatRoomId}`
                      }

                    </b>

                    {
                      unreadCount > 0 && (

                        <span className="unread-badge">

                          {unreadCount}

                        </span>
                      )
                    }

                  </div>

                </div>
              );
            })
          }

        </aside>

        {/* 채팅 */}
        <section
          key={currentRoomId}
          className="panel chat-room"
        >

          {/* 현재 채팅방 제목 */}
          <div className="chat-room-header">

            {
              rooms.find(
                r =>
                  Number(r.chatRoomId) ===
                  Number(currentRoomId)
              )?.roomName
            }

          </div>

          <div
            className="messages"
            ref={messagesRef}
          >

            {
              messages.map(message => (

                <div
                  key={
                    message.chatMessageId
                  }
                  className={`bubble ${
                    Number(message.senderId) ===
                    Number(loginUserId)
                      ? 'me'
                      : 'other'
                  }`}
                >

                  {
                    message.content ??
                    message.message
                  }

                </div>
              ))
            }

          </div>

          <form
            className="chat-form"
            onSubmit={send}
          >

            <input
              value={text}
              onChange={e =>
                setText(
                  e.target.value
                )
              }
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