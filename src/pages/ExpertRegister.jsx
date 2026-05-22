import { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { CATEGORIES, REGIONS } from '../data/constants';
import { Page, Input, FieldArea, SelectField } from '../components/common';

export default function ExpertRegister() {
  const [form, setForm] = useState({
    displayName: '',
    introduction: '',
    careerYears: '',
    mainCategoryId: '',
    mainLocationId: ''
  });

  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});

  const displayNameRef = useRef(null);
  const introductionRef = useRef(null);
  const careerYearsRef = useRef(null);
  const mainCategoryRef = useRef(null);
  const mainLocationRef = useRef(null);

  const clearError = (fieldName) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const focusFirstError = (nextErrors) => {
    const refs = {
      displayName: displayNameRef,
      introduction: introductionRef,
      careerYears: careerYearsRef,
      mainCategoryId: mainCategoryRef,
      mainLocationId: mainLocationRef
    };

    const order = [
      'displayName',
      'introduction',
      'careerYears',
      'mainCategoryId',
      'mainLocationId'
    ];

    const firstErrorField = order.find((field) => nextErrors[field]);
    const target = refs[firstErrorField]?.current;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => target.focus(), 250);
    }
  };

  const handleCareerChange = (value) => {
    const regex = /^\d{0,3}(\.\d{0,1})?$/;

    if (value === '' || regex.test(value)) {
      setForm((prev) => ({ ...prev, careerYears: value }));
      clearError('careerYears');
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.displayName.trim()) {
      nextErrors.displayName = '활동명을 입력해주세요.';
    }

    if (!form.introduction.trim()) {
      nextErrors.introduction = '소개글을 입력해주세요.';
    }

    if (form.careerYears === '') {
      nextErrors.careerYears = '경력을 입력해주세요.';
    } else if (form.careerYears.endsWith('.')) {
      nextErrors.careerYears = '경력을 올바른 숫자 형식으로 입력해주세요. 예: 3 또는 3.5';
    } else if (Number(form.careerYears) < 0) {
      nextErrors.careerYears = '경력은 0 이상으로 입력해주세요.';
    }

    if (!form.mainCategoryId) {
      nextErrors.mainCategoryId = '서비스 분야를 선택해주세요.';
    }

    if (!form.mainLocationId) {
      nextErrors.mainLocationId = '활동 지역을 선택해주세요.';
    }

    return nextErrors;
  };

  const submit = async (e) => {
  e.preventDefault();

  setDone(false);
  setMsg('');

  const nextErrors = validateForm();

  if (Object.keys(nextErrors).length > 0) {
    setErrors(nextErrors);
    focusFirstError(nextErrors);
    return;
  }

  setErrors({});

  const profilePayload = {
    displayName: form.displayName.trim(),
    introduction: form.introduction.trim(),
    careerYears: Number(form.careerYears),
    mainCategoryId: Number(form.mainCategoryId),
    mainLocationId: Number(form.mainLocationId)
  };

  const servicePayload = {
    categoryId: Number(form.mainCategoryId),
    serviceTitle: form.displayName.trim(),
    serviceDescription: form.introduction.trim(),
    price: 0
  };

  try {

    // 프로필 생성
    // 이미 존재해도 그냥 진행
    try {

      await api.post('/api/experts/profile', profilePayload);

    } catch (profileErr) {

      console.log('프로필 생성 스킵:', profileErr);

      // 절대 throw 하지 않음
    }

    // 서비스 생성
    await api.post('/api/expert-services', servicePayload);

    setDone(true);

  } catch (err) {

    console.error(err);

    setMsg(
      err?.response?.data?.message ||
      err?.response?.data?.result?.message ||
      err?.message ||
      '고수 등록에 실패했습니다.'
    );
  }
};

  return (
    <Page title="고수 서비스 등록" desc="고객에게 보여질 전문 분야와 활동 정보를 입력해주세요.">
      <div className="register-layout">
        <form className="panel form" onSubmit={submit}>
          <Input
            label="활동명"
            value={form.displayName}
            inputRef={displayNameRef}
            error={errors.displayName}
            onChange={(v) => {
              setForm({ ...form, displayName: v });
              clearError('displayName');
            }}
            placeholder="예: 자소서 첨삭 고수"
          />

          <FieldArea
            label="소개글"
            value={form.introduction}
            textareaRef={introductionRef}
            error={errors.introduction}
            onChange={(v) => {
              setForm({ ...form, introduction: v });
              clearError('introduction');
            }}
            placeholder="경력, 가능한 서비스, 진행 방식을 적어주세요."
          />

          <Input
            label="경력"
            type="text"
            inputMode="decimal"
            value={form.careerYears}
            inputRef={careerYearsRef}
            error={errors.careerYears}
            onChange={handleCareerChange}
            placeholder="예: 3 또는 3.5"
          />

          <SelectField
            label="서비스 분야"
            value={form.mainCategoryId}
            selectRef={mainCategoryRef}
            error={errors.mainCategoryId}
            onChange={(v) => {
              setForm({ ...form, mainCategoryId: v });
              clearError('mainCategoryId');
            }}
            options={CATEGORIES}
            placeholder="서비스 분야를 선택해주세요"
          />

          <SelectField
            label="활동 지역"
            value={form.mainLocationId}
            selectRef={mainLocationRef}
            error={errors.mainLocationId}
            onChange={(v) => {
              setForm({ ...form, mainLocationId: v });
              clearError('mainLocationId');
            }}
            options={REGIONS}
            placeholder="활동 지역을 선택해주세요"
          />

          {msg && <p className="error-text">{msg}</p>}

          <button className="btn btn-primary full">프로필 등록</button>

          {done && (
            <div className="done-box compact">
              <CheckCircle2 />
              <p>고수 프로필 등록이 완료되었습니다.</p>
            </div>
          )}
        </form>

        <aside className="panel guide-card">
          <h2>등록 후 이렇게 보여요</h2>
          <ul>
            <li>고수찾기 목록에 프로필 노출</li>
            <li>고객이 상세 페이지에서 견적 요청</li>
            <li>요청 수락 후 채팅 상담 진행</li>
          </ul>
        </aside>
      </div>
    </Page>
  );
}