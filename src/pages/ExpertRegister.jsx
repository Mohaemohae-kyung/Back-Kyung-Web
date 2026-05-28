import { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

import {
  SERVICE_CATEGORY_GROUPS,
  LOCATION_GROUPS
} from '../data/constants';

import {
  Page,
  Input,
  FieldArea,
  TreeSelectField
} from '../components/common';

export default function ExpertRegister() {

  const [form, setForm] = useState({
    displayName: '',
    introduction: '',
    careerYears: '',
    mainLocationId: '',
    mainCategoryId: '',
    subCategoryIds: []
  });

  const [subServiceDraft, setSubServiceDraft] = useState('');

  const [done, setDone] = useState(false);

  const [msg, setMsg] = useState('');

  const [errors, setErrors] = useState({});

  const displayNameRef = useRef(null);
  const introductionRef = useRef(null);
  const careerYearsRef = useRef(null);
  const mainLocationRef = useRef(null);
  const mainCategoryRef = useRef(null);

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
      mainLocationId: mainLocationRef,
      mainCategoryId: mainCategoryRef
    };

    const order = [
      'displayName',
      'introduction',
      'careerYears',
      'mainLocationId',
      'mainCategoryId'
    ];

    const firstErrorField = order.find(
      (field) => nextErrors[field]
    );

    const target = refs[firstErrorField]?.current;

    if (target) {

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      setTimeout(() => target.focus(), 250);

    }
  };

  const handleCareerChange = (value) => {

    const next = value.replace(',', '.');

    const regex = /^\d{0,3}(\.\d{0,1})?$/;

    if (next === '' || regex.test(next)) {

      setForm((prev) => ({
        ...prev,
        careerYears: next
      }));

      clearError('careerYears');

    }
  };

  const validateForm = () => {

    const nextErrors = {};

    if (!form.displayName.trim()) {

      nextErrors.displayName =
        '활동명을 입력해주세요.';
    }

    if (!form.introduction.trim()) {

      nextErrors.introduction =
        '소개글을 입력해주세요.';
    }

    if (form.careerYears === '') {

      nextErrors.careerYears =
        '경력을 입력해주세요.';

    } else if (
      form.careerYears.endsWith('.')
    ) {

      nextErrors.careerYears =
        '경력을 올바른 숫자 형식으로 입력해주세요.';

    } else if (
      Number(form.careerYears) < 0
    ) {

      nextErrors.careerYears =
        '경력은 0 이상이어야 합니다.';
    }

    if (!form.mainLocationId) {

      nextErrors.mainLocationId =
        '활동 지역을 선택해주세요.';
    }

    if (!form.mainCategoryId) {

      nextErrors.mainCategoryId =
        '메인 서비스를 선택해주세요.';
    }

    return nextErrors;
  };

  const getServiceLabel = (id) => {

    for (const group of SERVICE_CATEGORY_GROUPS) {

      const child = group.children?.find(
        (item) => String(item.id) === String(id)
      );

      if (child) {
        return `${group.name} > ${child.name}`;
      }
    }

    return '';
  };

  const getServiceName = (id) => {

    for (const group of SERVICE_CATEGORY_GROUPS) {

      const child = group.children?.find(
        (item) => String(item.id) === String(id)
      );

      if (child) {
        return child.name;
      }
    }

    return '서비스';
  };

  const addSubService = () => {

    if (!subServiceDraft) {

      setMsg('추가할 서비스를 선택해주세요.');
      return;
    }

    if (
      String(subServiceDraft) ===
      String(form.mainCategoryId)
    ) {

      setMsg(
        '메인 서비스는 추가 서비스로 중복 등록할 수 없습니다.'
      );

      return;
    }

    if (
      form.subCategoryIds.some(
        (id) => String(id) === String(subServiceDraft)
      )
    ) {

      setMsg('이미 추가한 서비스입니다.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      subCategoryIds: [
        ...prev.subCategoryIds,
        subServiceDraft
      ]
    }));

    setSubServiceDraft('');

    setMsg('');
  };

  const removeSubService = (categoryId) => {

    setForm((prev) => ({
      ...prev,
      subCategoryIds: prev.subCategoryIds.filter(
        (id) => String(id) !== String(categoryId)
      )
    }));
  };

  const submit = async (e) => {

    e.preventDefault();

    setDone(false);

    setMsg('');

    const nextErrors = validateForm();

    if (
      Object.keys(nextErrors).length > 0
    ) {

      setErrors(nextErrors);

      focusFirstError(nextErrors);

      return;
    }

    setErrors({});

    const profilePayload = {

      displayName:
        form.displayName.trim(),

      introduction:
        form.introduction.trim(),

      careerYears:
        Number(form.careerYears),

      mainCategoryId:
        Number(form.mainCategoryId),

      mainLocationId:
        Number(form.mainLocationId)
    };

    const selectedServiceIds = [
      form.mainCategoryId,
      ...form.subCategoryIds
    ].filter(Boolean);

    const servicePayloads =
      selectedServiceIds.map((categoryId) => ({
        categoryId:
          Number(categoryId),

        locationId:
          Number(form.mainLocationId),

        serviceTitle:
          getServiceName(categoryId),

        serviceDescription:
          form.introduction.trim(),

        price: 0
      }));

    console.log(
      '프로필 요청 데이터',
      profilePayload
    );

    console.log(
      '서비스 요청 데이터',
      servicePayloads
    );

    try {

      // =========================
      // 프로필 생성 시도
      // =========================

      try {

        const profileRes =
          await api.post(
            '/api/experts/profile',
            profilePayload
          );

        console.log(
          '프로필 생성 성공',
          profileRes
        );

      } catch (profileErr) {

        const responseData =
          profileErr?.response?.data;

        const resultMessage =
          responseData?.result;

        const mainMessage =
          responseData?.message;

        console.log(
          '기존 고수 프로필 사용'
        );

        console.log(
          'result:',
          resultMessage
        );

        console.log(
          'message:',
          mainMessage
        );

        // =========================
        // 이미 고수 프로필 존재
        // → 정상 흐름 처리
        // =========================

        if (
          resultMessage ===
          '이미 고수 프로필이 존재합니다.'
        ) {

          console.log(
            '기존 고수 프로필 확인 → 서비스 생성 진행'
          );

        } else {

          throw profileErr;

        }

      }

      // =========================
      // 서비스 생성
      // 메인 서비스 + 추가 서비스 전체 생성
      // =========================

      console.log(
        '서비스 생성 API 호출 시작'
      );

      const serviceResList =
        await Promise.all(
          servicePayloads.map((payload) =>
            api.post(
              '/api/expert-services',
              payload
            )
          )
        );

      console.log(
        '서비스 생성 성공',
        serviceResList
      );

      setDone(true);

      setMsg('');

    } catch (err) {

      console.error(
        '최종 에러',
        err
      );

      const responseData =
        err?.response?.data;

      setMsg(

        responseData?.result ||

        responseData?.message ||

        err?.message ||

        '고수 등록에 실패했습니다.'
      );
    }
  };

  return (

    <Page
      title="고수 서비스 등록"
      desc="고객에게 보여질 전문 분야와 활동 정보를 입력해주세요."
    >

      <div className="register-layout">

        <form
          className="panel form"
          onSubmit={submit}
        >

          <Input
            label="활동명"
            value={form.displayName}
            inputRef={displayNameRef}
            error={errors.displayName}
            onChange={(v) => {

              setForm({
                ...form,
                displayName: v
              });

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

              setForm({
                ...form,
                introduction: v
              });

              clearError('introduction');

            }}
            placeholder="경력, 가능한 서비스, 진행 방식을 적어주세요."
          />

          <Input
            label="경력"
            type="text"
            inputMode="decimal"
            placeholder="예: 3 또는 3.5"
            value={form.careerYears}
            inputRef={careerYearsRef}
            error={errors.careerYears}
            onChange={handleCareerChange}
          />

          <TreeSelectField
            label="활동 지역"
            value={form.mainLocationId}
            error={errors.mainLocationId}
            selectRef={mainLocationRef}
            onChange={(value) => {

              setForm({
                ...form,
                mainLocationId: value
              });

              clearError('mainLocationId');

            }}
            groups={LOCATION_GROUPS}
            placeholder="활동 지역을 선택해주세요"
          />

          <TreeSelectField
            label="메인 서비스"
            value={form.mainCategoryId}
            error={errors.mainCategoryId}
            selectRef={mainCategoryRef}
            onChange={(value) => {

              setForm((prev) => ({
                ...prev,
                mainCategoryId: value,
                subCategoryIds: prev.subCategoryIds.filter(
                  (id) => String(id) !== String(value)
                )
              }));

              clearError('mainCategoryId');

            }}
            groups={SERVICE_CATEGORY_GROUPS}
            placeholder="메인 서비스를 선택해주세요"
          />

          <div className="service-extra-box">

            <div className="service-extra-head">

              <span>
                추가 제공 서비스
              </span>

              <small>
                메인 서비스 외에 함께 제공할 서비스를 추가해주세요.
              </small>

            </div>

            <div className="service-add-row">

              <TreeSelectField
                label="추가할 서비스"
                value={subServiceDraft}
                onChange={setSubServiceDraft}
                groups={SERVICE_CATEGORY_GROUPS}
                placeholder="추가할 서비스를 선택해주세요"
                disabledIds={[
                  form.mainCategoryId,
                  ...form.subCategoryIds
                ].filter(Boolean)}
              />

              <button
                type="button"
                className="btn btn-ghost service-add-btn"
                onClick={addSubService}
              >
                추가
              </button>

            </div>

            {form.subCategoryIds.length > 0 && (

              <div className="service-chip-list">

                {form.subCategoryIds.map((categoryId) => (

                  <div
                    className="service-chip"
                    key={categoryId}
                  >

                    <span>
                      {getServiceLabel(categoryId)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSubService(categoryId)}
                    >
                      ×
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

          {msg && (
            <p className="error-text">
              {msg}
            </p>
          )}

          <button className="btn btn-primary full">
            프로필 등록
          </button>

          {done && (

            <div className="done-box compact">

              <CheckCircle2 />

              <p>
                고수 프로필 등록이 완료되었습니다.
              </p>

            </div>

          )}

        </form>

        <aside className="panel guide-card">

          <h2>
            등록 후 이렇게 보여요
          </h2>

          <ul>

            <li>
              고수찾기 목록에 프로필 노출
            </li>

            <li>
              고객이 상세 페이지에서 견적 요청
            </li>

            <li>
              요청 수락 후 채팅 상담 진행
            </li>

          </ul>

        </aside>

      </div>

    </Page>
  );
}