import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { api, getStoredUser } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { CATEGORIES } from '../data/constants';
import { Page, Input, FieldArea, SelectField } from '../components/common';

const SERVICE_TYPES = [
  { id: 'ONLINE', name: '온라인' },
  { id: 'OFFLINE', name: '대면' },
  { id: 'BOTH', name: '온라인/대면 모두' },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const getImageUrl = (url) => {
  if (!url) return '';

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
};

function getResult(data) {
  return data?.result ?? data?.data?.result ?? data?.data ?? data;
}

function getUploadedFileId(response) {
  const data = getResult(response);
  return data?.fileId ?? data?.id ?? data?.fileUploadId ?? data?.uploadFileId ?? null;
}

function getUploadedStoredName(response) {
  const data = getResult(response);

  if (data?.storedName) return data.storedName;

  const url = data?.fileUrl || data?.url || '';
  const cleanUrl = url.split('?')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop();

  return lastPart || null;
}

async function cleanupUploadedFile(uploadedFile) {
  const storedName = getUploadedStoredName(uploadedFile);

  if (!storedName) return;

  try {
    await api.delete(`/api/files?fileKey=${encodeURIComponent(storedName)}`);
  } catch {
    // 상품 등록 실패 시 임시 파일 삭제 시도
  }
}

export default function Market() {
  const user = getStoredUser();
  const isExpert = user?.role === 'EXPERT' || user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    categoryId: CATEGORIES[0]?.id || '1',
    title: '',
    thumbnailFile: null,
    thumbnailPreviewUrl: '',
    description: '',
    price: '',
    serviceType: 'ONLINE',
    serviceRegion: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setMsg('');
    try {
      const res = await api.get('/api/store-products');
      setItems(normalizeList(res));
    } catch (err) {
      setItems([]);
      setMsg(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm(prev => ({
        ...prev,
        thumbnailFile: null,
        thumbnailPreviewUrl: '',
      }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        thumbnailFile: '이미지 파일만 등록할 수 있습니다.',
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setForm(prev => ({
      ...prev,
      thumbnailFile: file,
      thumbnailPreviewUrl: previewUrl,
    }));

    setErrors(prev => ({
      ...prev,
      thumbnailFile: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.categoryId) {
      nextErrors.categoryId = '카테고리를 선택해주세요.';
    }

    if (!form.title.trim()) {
      nextErrors.title = '상품명을 입력해주세요.';
    }

    if (!form.price && form.price !== 0) {
      nextErrors.price = '가격을 입력해주세요.';
    } else if (Number(form.price) < 0) {
      nextErrors.price = '가격은 0원 이상이어야 합니다.';
    }

    if (!form.serviceType) {
      nextErrors.serviceType = '진행 방식을 선택해주세요.';
    }

    if (!form.serviceRegion.trim()) {
      nextErrors.serviceRegion = '서비스 지역을 입력해주세요.';
    }

    if (!form.thumbnailFile) {
      nextErrors.thumbnailFile = '대표 이미지를 선택해주세요.';
    }

    if (!form.description.trim()) {
      nextErrors.description = '상세 설명을 입력해주세요.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async e => {
    e.preventDefault();
    setMsg('');

    if (!isExpert) {
      alert('마켓 상품은 고수 회원만 등록할 수 있습니다.');
      return;
    }

    if (!validateForm()) {
      setMsg('입력하지 않은 항목을 확인해주세요.');
      return;
    }

    let uploadedThumbnail = null;
    let productCreated = false;

    try {
      setIsSubmitting(true);

      // 1. 대표 이미지 먼저 업로드
      uploadedThumbnail = await api.uploadFile(
        'STORE_PRODUCT',
        form.thumbnailFile
      );

      // 2. 업로드 응답에서 fileId 추출
      const thumbnailImageFileId = getUploadedFileId(uploadedThumbnail);

      if (!thumbnailImageFileId) {
        throw new Error('대표 이미지 업로드는 됐지만 응답에 fileId가 없습니다.');
      }

      // 3. 상품 등록 API 호출
      await api.post('/api/store-products', {
        categoryId: Number(form.categoryId),
        title: form.title.trim(),
        thumbnailImageFileId: Number(thumbnailImageFileId),
        description: form.description.trim(),
        price: Number(form.price),
        serviceType: form.serviceType,
        serviceRegion: form.serviceRegion.trim(),
      });

      productCreated = true;

      if (form.thumbnailPreviewUrl) {
        URL.revokeObjectURL(form.thumbnailPreviewUrl);
      }

      setForm({
        categoryId: CATEGORIES[0]?.id || '1',
        title: '',
        thumbnailFile: null,
        thumbnailPreviewUrl: '',
        description: '',
        price: '',
        serviceType: 'ONLINE',
        serviceRegion: '',
      });

      setErrors({});
      setShowForm(false);
      await load();
    } catch (err) {
      if (uploadedThumbnail && !productCreated) {
        await cleanupUploadedFile(uploadedThumbnail);
      }

      setMsg(err.message || '마켓 상품 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Page title="마켓" desc="원하는 서비스를 찾아보고 바로 요청해보세요.">
    {msg && <p className="message">{msg}</p>}
    {isExpert ? (
      <>
        <div className="panel guide-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <p className="muted" style={{ margin: 0 }}>
              고수 회원은 마켓 상품을 등록할 수 있어요.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm(prev => !prev)}
            >
              {showForm ? '등록 폼 닫기' : '마켓 상품 등록'}
            </button>
          </div>
        </div>

        {showForm && (
          <form className="panel form market-form" onSubmit={submit}>
            <h2>마켓 상품 등록</h2>
            
            <SelectField
              label="카테고리"
              value={form.categoryId}
              onChange={v => setForm({ ...form, categoryId: v })}
              options={CATEGORIES.filter(c => c.id)}
              error={errors.categoryId}
            />

            <Input
              label="상품명"
              value={form.title}
              onChange={v => setForm({ ...form, title: v })}
              error={errors.title}
            />

            <Input
              label="가격"
              type="number"
              value={form.price}
              onChange={v => setForm({ ...form, price: v })}
              error={errors.price}
            />

            <SelectField
              label="진행 방식"
              value={form.serviceType}
              onChange={v => setForm({ ...form, serviceType: v })}
              options={SERVICE_TYPES}
              error={errors.serviceType}
            />

            <Input
              label="서비스 지역"
              value={form.serviceRegion}
              onChange={v => setForm({ ...form, serviceRegion: v })}
              placeholder="예: 서울 / 온라인"
              error={errors.serviceRegion}
            />

            <label className={`field ${errors.thumbnailFile ? 'field-error' : ''}`}>
              <span>대표 이미지</span>

              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />

              {form.thumbnailPreviewUrl && (
                <div className="market-thumbnail-preview">
                  <img
                    src={form.thumbnailPreviewUrl}
                    alt="대표 이미지 미리보기"
                  />
                </div>
              )}

              {form.thumbnailFile && (
                <small className="muted">
                  선택된 파일: {form.thumbnailFile.name}
                </small>
              )}

              {errors.thumbnailFile && (
                <small className="field-error-text">
                  {errors.thumbnailFile}
                </small>
              )}
            </label>

            <FieldArea
              label="상세 설명"
              value={form.description}
              onChange={v => setForm({ ...form, description: v })}
              error={errors.description}
            />

            <button
              className="btn btn-primary full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '상품 등록'}
            </button>
          </form>
        )}
      </>
    ) : (
      <div className="panel guide-box">
        <p className="muted">고수 회원만 서비스 등록이 가능해요.</p>
      </div>
    )}

    {items.length ? (
      <div className="market-grid market-list-spacer">
        {items.map(x => (
          <Link
            className="card market-card"
            key={x.storeProductId || x.id}
            to={`/store-products/${x.storeProductId || x.id}`}
          >
            <div className="thumb">
              {x.thumbnailImageUrl ? (
                <img
                  src={getImageUrl(x.thumbnailImageUrl)}
                  alt={x.title || '마켓 상품 이미지'}
                />
              ) : (
                <ShoppingBag size={34} />
              )}
            </div>

            <span className="badge">{x.categoryName || x.category || '서비스'}</span>

            <h3>{x.title}</h3>

            <p>{x.description || x.desc}</p>

            <div className="meta">
              <span>{x.serviceType || '진행 방식 협의'}</span>
              <span>{x.serviceRegion || '지역 협의'}</span>
            </div>

            <div className="card-footer market-card-footer">
              <b>{Number(x.price || 0).toLocaleString()}원</b>
              <span className="market-detail-link">
                자세히 보기
              </span>
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <div className="panel empty-panel">
        <p className="muted">아직 등록된 서비스가 없습니다.</p>
      </div>
    )}
  </Page>;
}
