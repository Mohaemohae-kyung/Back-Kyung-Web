import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveAuth } from '../api/client';
import { AuthLayout, Input } from '../components/common';

export default function Login({ setUser }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const submit = async e => { e.preventDefault(); setMsg(''); try { const res = await api.post('/api/auth/login', form); saveAuth(res.result); setUser(res.result); nav('/mypage'); } catch (err) { setMsg(err.message); } };
  return <AuthLayout title="로그인" desc="매칭온 계정으로 요청 내역과 채팅을 확인하세요."><form className="form" onSubmit={submit}><Input label="이메일" value={form.email} onChange={v => setForm({ ...form, email: v })} /><Input label="비밀번호" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} /><button className="btn btn-primary full">로그인</button>{msg && <p className="message">{msg}</p>}</form></AuthLayout>;
}
