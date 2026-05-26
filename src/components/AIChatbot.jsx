import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Bot, Send, X, RotateCcw } from 'lucide-react';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatbot_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved chatbot messages:', e);
      }
    }
    return [
      {
        sender: 'bot',
        text: '안녕하세요! 매칭온 AI 상담원 매칭구입니다. 🤖✨\n\n궁금하신 고수님, 서비스, 마켓 상품 또는 플랫폼 이용 방법 등에 대해 자유롭게 질문해주세요!'
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('chatbot_session_id');
    if (!id) {
      id = 'session_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('chatbot_session_id', id);
    }
    return id;
  });

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Save messages in localStorage to persist chat within user session
    localStorage.setItem('chatbot_messages', JSON.stringify(messages));
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_LLM_API_URL || 'http://localhost:8000/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          mode: 'vulnerable'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'system',
            text: `⚠️ 에러: ${data.detail || '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.'}`
          }
        ]);
      }
    } catch (error) {
      console.error('LLM API Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: '⚠️ 서버 연결에 실패했습니다. 로컬 LLM 서버(http://localhost:8000)가 정상 작동 중인지 확인해주세요.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset chat history
  const handleReset = () => {
    if (window.confirm('대화 기록을 전부 초기화하시겠습니까?')) {
      const initialMessages = [
        {
          sender: 'bot',
          text: '대화 기록이 초기화되었습니다. 무엇이든 편하게 물어보세요! 🤖'
        }
      ];
      setMessages(initialMessages);
      localStorage.setItem('chatbot_messages', JSON.stringify(initialMessages));
    }
  };

  // Custom components for Markdown rendering to display links as neon buttons
  const markdownComponents = {
    a: ({ href, children }) => {
      const isInternal = href.startsWith('/');
      if (isInternal) {
        return (
          <Link to={href} className="chatbot-neon-btn" onClick={() => setIsOpen(false)}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="chatbot-neon-btn">
          {children}
        </a>
      );
    }
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button 
          className="chatbot-trigger-btn"
          onClick={() => setIsOpen(true)}
          aria-label="AI 챗봇 열기"
        >
          <MessageCircle size={26} />
          <span className="tooltip-text">AI 상담원</span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title-area">
              <div className="chatbot-avatar">
                <Bot size={20} />
              </div>
              <div>
                <h4>매칭구 AI 상담사</h4>
                <div className="chatbot-status">
                  <span className="status-dot"></span>
                  <small>상담 가능</small>
                </div>
              </div>
            </div>
            
            <div className="chatbot-header-actions">
              <button 
                onClick={handleReset} 
                className="chatbot-header-btn" 
                title="대화 초기화"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="chatbot-header-btn close-btn" 
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="chatbot-messages-body">
            {messages.map((msg, index) => {
              if (msg.sender === 'system') {
                return (
                  <div key={index} className="chatbot-msg-system">
                    <span>{msg.text}</span>
                  </div>
                );
              }
              return (
                <div key={index} className={`chatbot-msg-wrapper ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="chatbot-msg-avatar">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className={`chatbot-bubble ${msg.sender}`}>
                    {msg.sender === 'bot' ? (
                      <ReactMarkdown components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="chatbot-msg-wrapper bot">
                <div className="chatbot-msg-avatar">
                  <Bot size={14} />
                </div>
                <div className="chatbot-bubble bot typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              maxLength={1000}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
