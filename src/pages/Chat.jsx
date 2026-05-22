import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Page } from '../components/common';

export default function Chat() {
  const [messages, setMessages] = useState([{ from: 'other', text: '견적 요청 확인했습니다. 원하시는 일정이 있으실까요?' }, { from: 'me', text: '이번 주 가능한 시간으로 상담 받고 싶습니다.' }]);
  const [text, setText] = useState('');
  const messagesRef = useRef(null);
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);
  const send = e => { e.preventDefault(); if (!text.trim()) return; setMessages([...messages, { from: 'me', text }]); setText(''); };
  return <Page title="채팅" desc="고수와 견적, 일정, 진행 방식을 조율하세요.">
    <div className="chat-layout">
      <aside className="panel chat-list"><h2>대화 목록</h2><div className="chat-user active"><b>진행 중인 상담</b><p>견적 및 일정 조율</p></div></aside>
      <section className="panel chat-room"><div className="chat-head"><div><h2>상담 채팅</h2><p>견적, 일정, 진행 방식을 조율하세요.</p></div><span className="badge">진행중</span></div><div className="messages" ref={messagesRef}>{messages.map((m, i) => <div className={`bubble ${m.from}`} key={i}>{m.text}</div>)}</div><form className="chat-form" onSubmit={send}><input value={text} onChange={e => setText(e.target.value)} placeholder="메시지를 입력하세요" /><button className="btn btn-primary"><Send size={16} />전송</button></form></section>
    </div>
  </Page>;
}
