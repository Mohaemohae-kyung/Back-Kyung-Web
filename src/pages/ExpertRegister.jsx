import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// API 응답에서 result만 꺼내기
const getResult = (res) => {
  return res?.result || res?.data?.result || res;
};

// 이름으로 하위 항목 id 찾기
const findChildIdByName = (groups, name) => {
  if (!name) return '';

  for (const group of groups) {
    const child = group.children?.find(
      (item) => item.name === name
    );

    if (child) {
      return String(child.id);
    }
  }

  return '';
};

// 백엔드가 내려주는 portfolioWebViewUrl에서 원래 외부 포트폴리오 주소만 꺼내기
const extractExternalPortfolioUrl = (portfolioWebViewUrl) => {
  if (!portfolioWebViewUrl) return '';

  try {
    const url = new URL(portfolioWebViewUrl);
    return url.searchParams.get('url') || '';
  } catch (err) {
    const marker = 'url=';
    const index = portfolioWebViewUrl.indexOf(marker);

    if (index === -1) {
      return portfolioWebViewUrl;
    }

    return decodeURIComponent(
      portfolioWebViewUrl.slice(index + marker.length)
    );
  }
};

// 이름 목록을 id 목록으로 변환
const findChildIdsByNames = (groups, names = []) => {
  return names
    .map((name) => findChildIdByName(groups, name))
    .filter(Boolean);
};

export default function ExpertRegister() {

  const [searchParams] = useSearchParams();

  // 수정 화면 여부 확인
  const isEditMode =
    searchParams.get('mode') === 'edit';

  const [form, setForm] = useState({
    displayName: '',
    introduction: '',
    careerYears: '',
    mainLocationId: '',
    mainCategoryId: '',
    subCategoryIds: [],
    externalPortfolioUrl: ''
  });

  const [subServiceDraft, setSubServiceDraft] = useState('');

  const [expertProfileImageFile, setExpertProfileImageFile] = useState(null);

  const [expertProfileImagePreviewUrl, setExpertProfileImagePreviewUrl] = useState('');

  const [existingExpertProfileImageUrl, setExistingExpertProfileImageUrl] = useState('');

  const [imageUploadResult, setImageUploadResult] = useState(null);

  const [imageUploading, setImageUploading] = useState(false);

  const [done, setDone] = useState(false);

  const [msg, setMsg] = useState('');

  const [errors, setErrors] = useState({});

  // 수정 화면에서 기존 값 불러올 때 사용
  const [loading, setLoading] = useState(isEditMode);

  const displayNameRef = useRef(null);
  const introductionRef = useRef(null);
  const careerYearsRef = useRef(null);
  const mainLocationRef = useRef(null);
  const mainCategoryRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!expertProfileImageFile) {
      setExpertProfileImagePreviewUrl(existingExpertProfileImageUrl || '');
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(expertProfileImageFile);
    setExpertProfileImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [expertProfileImageFile, existingExpertProfileImageUrl]);

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;

    const loadMyExpertProfile = async () => {
      try {
        setLoading(true);
        setMsg('');

        // 내 정보에서 expertProfileId 확인
        const myRes = await api.get('/api/users/me');
        const myInfo = getResult(myRes);

        if (!myInfo?.expertProfileId) {
          setMsg('등록된 고수 프로필이 없습니다.');
          return;
        }

        // 내 고수 프로필 상세 조회
        const detailRes = await api.get(
          `/api/experts/${myInfo.expertProfileId}`
        );

        const detail = getResult(detailRes);

        if (ignore) return;

        const mainCategoryId = findChildIdByName(
          SERVICE_CATEGORY_GROUPS,
          detail.mainCategoryName
        );

        const mainLocationId = findChildIdByName(
          LOCATION_GROUPS,
          detail.mainLocationName
        );

        const categoryIds = findChildIdsByNames(
          SERVICE_CATEGORY_GROUPS,
          detail.categoryNames || []
        );

        const subCategoryIds = categoryIds.filter(
          (id) => String(id) !== String(mainCategoryId)
        );

        setForm({
          displayName: detail.displayName || '',
          introduction: detail.introduction || '',
          careerYears:
            detail.careerYears !== null &&
            detail.careerYears !== undefined
              ? String(detail.careerYears)
              : '',
          mainLocationId,
          mainCategoryId,
          subCategoryIds,

          // 수정 화면에서 기존 포트폴리오 주소 표시
          externalPortfolioUrl:
            detail.externalPortfolioUrl ||
            extractExternalPortfolioUrl(detail.portfolioWebViewUrl)
        });

        setExistingExpertProfileImageUrl(detail.expertProfileImageUrl || '');
        setImageUploadResult(null);

      } catch (err) {
        if (!ignore) {
          setMsg(
            err?.response?.data?.result ||
            err?.response?.data?.message ||
            err?.message ||
            '고수 프로필 정보를 불러오지 못했습니다.'
          );
        }

      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

  loadMyExpertProfile();

  return () => {
    ignore = true;
  };
}, [isEditMode]);

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

  const handleExpertProfileImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setExpertProfileImageFile(file);
    setImageUploadResult(null);
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

    // 메인 서비스 + 추가 서비스 id 합치기
    const categoryIds = [
      form.mainCategoryId,
      ...form.subCategoryIds
    ]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    // 중복 제거
    const distinctCategoryIds = [...new Set(categoryIds)];

    // 백엔드 프로필 등록/수정 요청 데이터
    const profilePayload = {
      displayName: form.displayName.trim(),
      introduction: form.introduction.trim(),
      careerYears: Number(form.careerYears),
      mainCategoryId: Number(form.mainCategoryId),
      mainLocationId: Number(form.mainLocationId),
      categoryIds: distinctCategoryIds,

      // 사용자가 입력한 외부 포트폴리오 주소
      externalPortfolioUrl:
        form.externalPortfolioUrl.trim() || null
    };

    console.log(
      isEditMode
        ? '고수 프로필 수정 요청 데이터'
        : '고수 프로필 등록 요청 데이터',
      profilePayload
    );

    setImageUploading(false);

    try {

  // =========================
  // 프로필 등록 / 수정
  // =========================

  if (isEditMode) {

    await api.patch(
      '/api/experts/profile',
      profilePayload
    );

  } else {

    try {

      await api.post(
        '/api/experts/profile',
        profilePayload
      );

    } catch (profileErr) {

      const responseData =
        profileErr?.response?.data;

      const resultMessage =
        responseData?.result;

      // 이미 존재하면 정상 처리
      if (
        resultMessage !==
        '이미 고수 프로필이 존재합니다.'
      ) {

        throw profileErr;

      }

    }
  }

  if (expertProfileImageFile) {

    setImageUploading(true);

    const uploadRes =
      await api.uploadExpertProfileImage(expertProfileImageFile);

    const uploadResult =
      getResult(uploadRes);

    setImageUploadResult(uploadResult);
    setExistingExpertProfileImageUrl(uploadResult?.expertProfileImageUrl || '');
    setExpertProfileImageFile(null);
    setImageUploading(false);
  }

  setDone(true);

  setMsg(
    isEditMode
      ? '고수 프로필이 수정되었습니다.'
      : '고수 프로필 등록이 완료되었습니다.'
  );

  navigate('/experts');

} catch (err) {

      setImageUploading(false);

      console.error(
        '고수 프로필 저장 실패',
        err
      );

      const responseData =
        err?.response?.data;

      setMsg(

        responseData?.result ||

        responseData?.message ||

        err?.message ||

        '고수 프로필 저장에 실패했습니다.'
      );
    }
  };

  return (

    <Page
      title={
        isEditMode
          ? '고수 프로필 수정'
          : '고수 프로필 등록'
      }
      desc={
        isEditMode
          ? '내 고수 프로필과 제공 서비스를 수정합니다.'
          : '고객에게 보여질 전문 분야와 활동 정보를 입력해주세요.'
      }
    >

      {loading ? (
        <p className="muted">
          고수 프로필 정보를 불러오는 중입니다.
        </p>
      ) : (
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

                // 추가 서비스 선택 대기값이 새 메인 서비스와 같으면 초기화
                setSubServiceDraft((prev) =>
                  String(prev) === String(value) ? '' : prev
                );

                setForm((prev) => ({
                  ...prev,

                  // 선택한 값을 메인 서비스로 저장
                  mainCategoryId: value,

                  // 혹시 추가 서비스 목록에 같은 값이 있으면 제거
                  subCategoryIds: prev.subCategoryIds.filter(
                    (id) => String(id) !== String(value)
                  )
                }));

                clearError('mainCategoryId');

              }}

              // 이미 추가 서비스로 선택한 항목은 메인 서비스에서 선택 불가
              disabledIds={form.subCategoryIds}

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

            <Input
              label="포트폴리오"
              value={form.externalPortfolioUrl}
              onChange={(v) => {
                setForm({
                  ...form,
                  externalPortfolioUrl: v
                });
              }}
              placeholder="외부 포트폴리오 주소를 입력해주세요. (이미지 등)"
            />

            <label className="field expert-profile-image-field">

              <span>고수 프로필 이미지</span>

              <div className="expert-profile-image-uploader">

                <div className="expert-profile-image-preview">

                  {expertProfileImagePreviewUrl ? (

                    <img
                      src={expertProfileImagePreviewUrl}
                      alt="고수 프로필 이미지 미리보기"
                    />

                  ) : (

                    <span>이미지 미리보기</span>

                  )}

                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleExpertProfileImageChange}
                />

                <small className="field-helper-text">
                  JPG, PNG, GIF, WebP, SVG 파일을 업로드할 수 있습니다.
                </small>

                {expertProfileImageFile && (
                  <small className="field-helper-text">
                    선택됨: {expertProfileImageFile.name}
                  </small>
                )}

                {imageUploading && (
                  <small className="field-helper-text">
                    고수 프로필 이미지를 업로드하는 중입니다.
                  </small>
                )}

                {imageUploadResult?.expertProfileImageUrl && (
                  <small className="field-helper-text">
                    업로드 완료: {imageUploadResult.expertProfileImageUrl}
                  </small>
                )}

              </div>

            </label>

            {msg && (
              <p className="error-text">
                {msg}
              </p>
            )}

            <button className="btn btn-primary full">
              {isEditMode
                ? '프로필 수정'
                : '프로필 등록'}
            </button>

            {done && (

              <div className="done-box compact">

                <CheckCircle2 />

                <p>
                  {isEditMode
                    ? '고수 프로필 수정이 완료되었습니다.'
                    : '고수 프로필 등록이 완료되었습니다.'}
                </p>

              </div>

            )}

          </form>

          <aside className="panel guide-card">

            <h2>
              {isEditMode
                ? '수정 후 반영되는 내용'
                : '등록 후 이렇게 보여요'}
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
      )}

    </Page>
  );
}
