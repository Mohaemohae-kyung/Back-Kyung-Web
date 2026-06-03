import { useRef, useState } from 'react';
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

  const [errors, setErrors] = useState({});

  const refs = {
    email: useRef(null),
    password: useRef(null),
    name: useRef(null),
    residentNumberFront: useRef(null),
    residentNumberBack: useRef(null),
    nickname: useRef(null),
    phone: useRef(null),
    detailAddress: useRef(null)
  };

  const focusFirstError = (nextErrors) => {
    const firstErrorKey = Object.keys(nextErrors)[0];

    if (!firstErrorKey) return;

    const focusKey =
      firstErrorKey === 'residentNumber'
        ? 'residentNumberFront'
        : firstErrorKey;

    refs[focusKey]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    setTimeout(() => {
      refs[focusKey]?.current?.focus();
    }, 250);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));

    setErrors((prev) => {
      const next = {
        ...prev,
        [key]: ''
      };

      if (key === 'residentNumberFront' || key === 'residentNumberBack') {
        next.residentNumber = '';
      }

      return next;
    });

    setMsg('');
  };

  const submit = async e => {
    e.preventDefault();
    setMsg('');
    setErrors({});

    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = '올바른 이메일 형식으로 입력해주세요.';
    }

    if (!form.password) {
      nextErrors.password = '비밀번호를 입력해주세요.';
    } else if (form.password.length < 8 || form.password.length > 20) {
      nextErrors.password = '비밀번호는 8자 이상 20자 이하로 입력해주세요.';
    }

    if (!form.name.trim()) {
      nextErrors.name = '이름을 입력해주세요.';
    }

    if (
      form.residentNumberFront.length !== 6 ||
      form.residentNumberBack.length !== 7
    ) {
      nextErrors.residentNumber = '주민등록번호를 올바르게 입력해주세요.';
    }
    
    if (!form.nickname.trim()) {
      nextErrors.nickname = '닉네임을 입력해주세요.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^01[016789]\d{7,8}$/.test(form.phone.replace(/\D/g, ''))) {
      nextErrors.phone = '휴대폰 번호 형식으로 입력해주세요.';
    }

    if (!form.detailAddress.trim()) {
      nextErrors.detailAddress = '상세주소를 입력해주세요.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    const residentRegistrationNumber =
      `${form.residentNumberFront}-${form.residentNumberBack}`;

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
      setMsg(err.message || '회원가입 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <AuthLayout title="회원가입" desc="간단한 정보 입력 후 매칭온을 시작하세요.">
      <form className="form" onSubmit={submit}>
        <Input
          label="이메일"
          value={form.email}
          error={errors.email}
          inputRef={refs.email}
          autoComplete="email"
          onChange={v => handleChange('email', v)}
        />

        <Input
          label="비밀번호"
          type="password"
          value={form.password}
          maxLength={20}
          error={errors.password}
          inputRef={refs.password}
          autoComplete="new-password"
          helperText="비밀번호는 8자 이상 20자 이하로 입력해주세요."
          onChange={v => handleChange('password', v)}
        />

        <Input
          label="이름"
          value={form.name}
          error={errors.name}
          inputRef={refs.name}
          onChange={v => handleChange('name', v)}
        />

        <div className={`field rrn-field ${errors.residentNumber ? 'field-error' : ''}`}>
          <span>주민등록번호</span>

          <div className="rrn-row">
            <input
              ref={refs.residentNumberFront}
              className="rrn-input"
              type="text"
              inputMode="numeric"
              value={form.residentNumberFront}
              maxLength={6}
              placeholder="앞 6자리"
              onChange={e =>
                handleChange(
                  'residentNumberFront',
                  e.target.value.replace(/\D/g, '').slice(0, 6)
                )
              }
            />

            <span className="rrn-dash">-</span>

            <input
              ref={refs.residentNumberBack}
              className="rrn-input"
              type="password"
              inputMode="numeric"
              value={form.residentNumberBack}
              maxLength={7}
              placeholder="뒤 7자리"
              onChange={e =>
                handleChange(
                  'residentNumberBack',
                  e.target.value.replace(/\D/g, '').slice(0, 7)
                )
              }
            />
          </div>

          {errors.residentNumber && (
            <small className="field-error-text">
              {errors.residentNumber}
            </small>
          )}
        </div>

        <Input
          label="닉네임"
          value={form.nickname}
          error={errors.nickname}
          inputRef={refs.nickname}
          onChange={v => handleChange('nickname', v)}
        />

        <Input
          label="전화번호"
          value={form.phone}
          error={errors.phone}
          inputRef={refs.phone}
          inputMode="numeric"
          onChange={v =>
            handleChange('phone', v.replace(/\D/g, '').slice(0, 11))
          }
        />

        <Input
          label="상세주소"
          value={form.detailAddress}
          placeholder="동/호수 등 상세주소를 입력해주세요"
          error={errors.detailAddress}
          inputRef={refs.detailAddress}
          onChange={v => handleChange('detailAddress', v)}
        />

        <button className="btn btn-primary full">회원가입</button>

        {msg && <p className="message">{msg}</p>}
      </form>
    </AuthLayout>
  );
}