import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AuthLayout, Input } from '../components/common';

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    nickname: '',
    phone: '',
    residentNumberFront: '',
    residentNumberBack: '',
    detailAddress: ''
  });
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('');

    const residentRegistrationNumber =
      `${form.residentNumberFront}-${form.residentNumberBack}`;

    if (form.residentNumberFront.length !== 6) {
      setMsg('주민등록번호 앞 6자리를 입력해주세요.');
      return;
    }

    if (form.residentNumberBack.length !== 7) {
      setMsg('주민등록번호 뒤 7자리를 입력해주세요.');
      return;
    }

    if (!form.detailAddress.trim()) {
      setMsg('상세주소를 입력해주세요.');
      return;
    }

    const signupPayload = {
      email: form.email,
      password: form.password,
      name: form.name,
      nickname: form.nickname,
      phone: form.phone,
      residentRegistrationNumber,
      detailAddress: form.detailAddress
    };

    try {
      await api.post('/api/auth/signup', signupPayload);
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

        <div className="field rrn-field">
          <span>주민등록번호</span>

          <div className="rrn-row">
            <input
              className="rrn-input"
              type="text"
              inputMode="numeric"
              value={form.residentNumberFront}
              maxLength={6}
              placeholder="앞 6자리"
              onChange={e =>
                setForm({
                  ...form,
                  residentNumberFront: e.target.value.replace(/\D/g, '').slice(0, 6)
                })
              }
            />

            <span className="rrn-dash">-</span>

            <input
              className="rrn-input"
              type="password"
              inputMode="numeric"
              value={form.residentNumberBack}
              maxLength={7}
              placeholder="뒤 7자리"
              onChange={e =>
                setForm({
                  ...form,
                  residentNumberBack: e.target.value.replace(/\D/g, '').slice(0, 7)
                })
              }
            />
          </div>
        </div>

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

        <Input
          label="상세주소"
          value={form.detailAddress}
          placeholder="동/호수 등 상세주소를 입력해주세요"
          onChange={v => setForm({ ...form, detailAddress: v })}
        />

        <button className="btn btn-primary full">회원가입</button>

        {msg && <p className="message">{msg}</p>}
      </form>
    </AuthLayout>
  );
}