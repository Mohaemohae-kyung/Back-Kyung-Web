import { useEffect, useRef, useState } from 'react';
import {
  useNavigate,
  useParams,
  useLocation
} from 'react-router-dom';
import { Send } from 'lucide-react';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';

import { Page } from '../components/common';
import { api } from '../api/client';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080';

export default function Chat() {

  const navigate = useNavigate();

  const location =
    useLocation();

  const { roomId } = useParams();

  const currentRoomId =
    Number(roomId);

  const [rooms, setRooms] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState('');

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const [paymentTitle, setPaymentTitle] =
    useState('');

  const [paymentAmount, setPaymentAmount] =
    useState('');

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

  const onMessageRef =
    useRef(null);

  const token =
    localStorage.getItem('accessToken');

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

  const alreadyRequestedPayment =
    messages.some(
      m =>
        m.messageType ===
        'PAYMENT_REQUEST'
    );

  useEffect(() => {

    currentRoomIdRef.current =
      currentRoomId;

  }, [currentRoomId]);

  useEffect(() => {

    onMessageRef.current =
      (message) => {

        const newMessage =
          JSON.parse(message.body);

        console.log(
          '실시간 메시지',
          newMessage
        );

        setMessages(prev => [
          ...prev,
          {
            ...newMessage,

            content:
              newMessage.content ||
              newMessage.message ||
              '결제가 완료되었습니다.'
          }
        ]);
      };

  });

  const loadRooms = async () => {

    try {

      const res =
        await api.get('/api/chat/rooms');

      setRooms(
        res.result ||
        res ||
        []
      );

    } catch (err) {

      console.error(err);
    }
  };

  const loadMessages = async () => {

    try {

      const res =
        await api.get(
          `/api/chat/rooms/${currentRoomId}/messages`
        );

      setMessages(
        res.result ||
        res ||
        []
      );

    } catch (err) {

      console.error(err);
    }
  };

  const subscribeToRoom =
    (client, roomId) => {

      if (subscriptionRef.current) {

        subscriptionRef.current.unsubscribe();

        subscriptionRef.current =
          null;
      }

      if (!roomId) return;

      subscriptionRef.current =
        client.subscribe(
          `/sub/chat/room/${roomId}`,
          message => {
            onMessageRef.current?.(
              message
            );
          }
        );
    };

  useEffect(() => {

    const client =
      new Client({

        webSocketFactory: () =>
          new SockJS(
            `${API_BASE_URL}/ws-stomp`
          ),

        reconnectDelay: 5000,

        connectHeaders: {
          Authorization:
            `Bearer ${token}`
        },

        onConnect: () => {

          subscribeToRoom(
            client,
            currentRoomIdRef.current
          );

          notifySubscriptionRef.current =
            client.subscribe(
              `/sub/chat/notify/${loginUserId}`,
              message => {

                const notify =
                  JSON.parse(message.body);

                if (
                  Number(notify.roomId) ===
                  Number(currentRoomIdRef.current)
                ) {
                  return;
                }

                setRooms(prev =>
                  prev.map(room => {

                    if (
                      Number(room.chatRoomId) ===
                      Number(notify.roomId)
                    ) {

                      return {
                        ...room,
                        unreadCount:
                          (room.unreadCount || 0) + 1
                      };
                    }

                    return room;
                  })
                );
              }
            );
        }
      });

    client.activate();

    clientRef.current =
      client;

    return () => {

      subscriptionRef.current?.unsubscribe();

      notifySubscriptionRef.current?.unsubscribe();

      client.deactivate();
    };

  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {

    if (!currentRoomId) return;

    loadMessages();

    if (clientRef.current?.connected) {

      subscribeToRoom(
        clientRef.current,
        currentRoomId
      );
    }

  }, [currentRoomId]);

  useEffect(() => {

    if (!currentRoomId) return;

    api.patch(
      `/api/chat/rooms/${currentRoomId}/read`
    )
      .then(() => {

        setRooms(prev =>
          prev.map(room => {

            if (
              Number(room.chatRoomId) ===
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

  const send = (e) => {

    e.preventDefault();

    if (!text.trim()) return;

    if (!clientRef.current?.connected) {

      alert('웹소켓 연결 안됨');

      return;
    }

    clientRef.current.publish({
      destination:
        '/pub/chat/message',

      body: JSON.stringify({
        roomId: currentRoomId,
        senderId: loginUserId,
        type: 'TEXT',
        message: text
      })
    });

    setText('');
  };

  useEffect(() => {

    if (
      !location.state?.paymentCompleted
    ) return;

    const interval = setInterval(() => {

      if (!clientRef.current?.connected)
        return;

      clientRef.current.publish({

        destination:
          '/pub/chat/message',

        body: JSON.stringify({
          roomId: currentRoomId,

          senderId: loginUserId,

          type:'TEXT',

          message:'결제가 완료되었습니다.'
        })
      });

      clearInterval(interval);

    }, 500);

    return () => clearInterval(interval);

  }, [location.state]);

  return (

    <Page
      title="채팅"
      desc="고수와 견적, 일정, 진행 방식을 조율하세요."
    >

      {
        !currentRoomId ? (

          <div className="panel chat-list">

            <h2>
              대화 목록
            </h2>

            {
              rooms.map(room => {

                const unreadCount =
                  room.unreadCount || 0;

                return (

                  <div
                    key={room.chatRoomId}

                    className={`chat-user ${
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

          </div>

        ) : (

          <section
            key={currentRoomId}
            className="panel chat-room"
          >

            <div className="chat-room-header">

              <div className="chat-header-left">

                <button
                  className="chat-back-btn"
                  onClick={() =>
                    navigate('/chat')
                  }
                >
                  ←
                </button>

                <span className="chat-room-title">

                  {
                    rooms.find(
                      r =>
                        Number(r.chatRoomId) ===
                        Number(currentRoomId)
                    )?.roomName
                  }

                </span>

              </div>

              {
                Number(
                  rooms.find(
                    r =>
                      Number(r.chatRoomId) ===
                      Number(currentRoomId)
                  )?.userId
                ) !== Number(loginUserId) && (

                  <button
                    type="button"

                    className="btn btn-primary payment-request-btn"

                    disabled={
                      paymentLoading ||
                      alreadyRequestedPayment
                    }

                    onClick={() =>
                      setPaymentModalOpen(true)
                    }
                  >
                    {
                      alreadyRequestedPayment
                        ? '결제 요청 완료'
                        : '결제 요청'
                    }
                  </button>
                )
              }

            </div>

            {
              paymentModalOpen && (

                <div className="payment-modal-overlay">

                  <div className="payment-modal">

                    <div className="payment-modal-title">
                      Mock PG 결제
                    </div>

                    <div className="payment-modal-desc">
                      서비스명과 금액을 입력해주세요.
                    </div>

                    <div className="payment-modal-field">

                      <label>
                        서비스명
                      </label>

                      <input
                        type="text"

                        placeholder="서비스명을 입력하세요"

                        value={paymentTitle}

                        onChange={e =>
                          setPaymentTitle(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="payment-modal-field">

                      <label>
                        결제금액
                      </label>

                      <input
                        type="number"

                        placeholder="금액 입력"

                        value={paymentAmount}

                        onChange={e =>
                          setPaymentAmount(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <button
                      className="btn btn-primary payment-submit-btn"

                      disabled={paymentLoading}

                      onClick={async () => {

                        const currentRoom =
                          rooms.find(
                            r =>
                              Number(r.chatRoomId) ===
                              Number(currentRoomId)
                          );

                        if (
                          !paymentTitle ||
                          !paymentAmount
                        ) {

                          alert(
                            '서비스명과 금액을 입력하세요.'
                          );

                          return;
                        }

                        setPaymentLoading(true);

                        try {

                          await api.patch(
                            `/api/service-requests/${currentRoom?.serviceRequestId}`,
                            {
                              title: paymentTitle,
                              content: '결제 요청',
                              budget: Number(paymentAmount)
                            }
                          );
                          
                          await api.post(
                            `/api/payments/service-requests/${currentRoom?.serviceRequestId}/request`,
                            {
                              paymentMethod: 'CARD',
                              pgProvider: 'TEST_PG'
                            }
                          );

                          setPaymentModalOpen(false);

                          setPaymentTitle('');

                          setPaymentAmount('');

                          loadMessages();

                        } catch (err) {

                          console.error(err);

                          alert('결제 요청 실패');

                        } finally {

                          setPaymentLoading(false);
                        }
                      }}
                    >
                      요청하기
                    </button>

                  </div>

                </div>
              )
            }

            <div
              className="messages"
              ref={messagesRef}
            >

              {
                messages.map(message => {

                  if (
                    message.messageType ===
                    'PAYMENT_REQUEST'
                  ) {

                    return (

                      <div
                        key={message.chatMessageId}

                        className={`bubble ${
                          Number(message.senderId) ===
                          Number(loginUserId)
                            ? 'me'
                            : 'other'
                        }`}
                      >

                        <div className="payment-title">
                          결제 요청
                        </div>

                        <div className="payment-content">
                          {message.content}
                        </div>

                        {
                          Number(message.senderId) !==
                          Number(loginUserId) && (

                            message.paymentStatus === 'PAID' ? (

                              <div className="payment-complete">
                                결제 완료
                              </div>

                            ) : (

                              <button
                                className="btn btn-primary payment-btn"

                                onClick={() => {

                                  navigate(
                                    `/payments/${message.paymentId}`,
                                    {
                                      state:{
                                        roomId: currentRoomId
                                      }
                                    }
                                  );

                                }}
                              >
                                결제하기
                              </button>

                            )
                          )
                        }

                      </div>
                    );
                  }

                  return (

                    <div
                      key={message.chatMessageId}

                      className={`bubble ${
                        Number(message.senderId) ===
                        Number(loginUserId)
                          ? 'me'
                          : 'other'
                      }`}
                    >
                      {
                        message.content ||
                        message.message
                      }
                    </div>
                  );
                })
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
        )
      }

    </Page>
  );
}
