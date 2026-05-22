import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AuthLayout, Input } from '../components/common';

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', nickname: '', phone: '' });
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('');

    try {
      await api.post('/api/auth/signup', form);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      nav('/login');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <AuthLayout title="회원가입" desc="간단한 정보 입력 후 매칭온을 시작하세요.">
      <form className="form" onSubmit={submit}>
        <Input
          label="이메일"
          value={form.email}
          onChange={v => setForm({ ...form, email: v })}
        />

        <Input
          label="비밀번호"
          type="password"
          value={form.password}
          maxLength={20}
          onChange={v => setForm({ ...form, password: v })}
        />

        <p className="muted" style={{ margin: '-8px 0 0', fontSize: 13 }}>
          비밀번호는 8자 이상 20자 이하로 입력해주세요.
        </p>

        <Input
          label="이름"
          value={form.name}
          onChange={v => setForm({ ...form, name: v })}
        />

        <Input
          label="닉네임"
          value={form.nickname}
          onChange={v => setForm({ ...form, nickname: v })}
        />

        <Input
          label="전화번호"
          value={form.phone}
          onChange={v => setForm({ ...form, phone: v })}
        />

        <button className="btn btn-primary full">회원가입</button>

        {msg && <p className="message">{msg}</p>}
      </form>
    </AuthLayout>
  );
}