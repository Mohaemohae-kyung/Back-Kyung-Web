import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveAuth } from '../api/client';
import { AuthLayout, Input } from '../components/common';

export default function Login({ setUser }) {
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [msg, setMsg] = useState('');

  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value
    });

    // 사용자가 다시 입력하면 기존 실패 안내 제거
    if (msg) {
      setMsg('');
    }
  };

  const submit = async e => {
    e.preventDefault();

    try {
      const res = await api.post('/api/auth/login', form);

      saveAuth(res.result);
      setUser(res.result);
      nav('/mypage');
    } catch (err) {
      setMsg('이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <AuthLayout
      title="로그인"
      desc="매칭온 계정으로 요청 내역과 채팅을 확인하세요."
    >
      <form className="form" onSubmit={submit}>
        <Input
          label="이메일"
          value={form.email}
          onChange={v => handleChange('email', v)}
        />

        <Input
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={v => handleChange('password', v)}
        />

        {msg && (
          <p className="login-error-message">
            {msg}
          </p>
        )}

        <button className="btn btn-primary full">
          로그인
        </button>
      </form>
    </AuthLayout>
  );
}