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

export default function Market() {
  const user = getStoredUser();
  const isExpert = user?.role === 'EXPERT' || user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    categoryId: CATEGORIES[1]?.id || '1',
    title: '',
    thumbnailImageUrl: 'https://via.placeholder.com/300x180?text=MatchingOn',
    description: '',
    price: '',
    serviceType: 'ONLINE',
    serviceRegion: '',
  });

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

  const submit = async e => {
    e.preventDefault();
    if (!isExpert) return alert('마켓 상품은 고수 회원만 등록할 수 있습니다.');
    try {
      await api.post('/api/store-products', {
        ...form,
        categoryId: Number(form.categoryId),
        price: Number(form.price)
      });

      setForm({ ...form, title: '', description: '', price: '', serviceRegion: '' });
      setShowForm(false);
      await load();
    } catch (err) { setMsg(err.message); }
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
            <SelectField label="카테고리" value={form.categoryId} onChange={v => setForm({ ...form, categoryId: v })} options={CATEGORIES.filter(c => c.id)} />
            <Input label="상품명" value={form.title} onChange={v => setForm({ ...form, title: v })} />
            <Input label="가격" type="number" value={form.price} onChange={v => setForm({ ...form, price: v })} />
            <SelectField label="진행 방식" value={form.serviceType} onChange={v => setForm({ ...form, serviceType: v })} options={SERVICE_TYPES} />
            <Input label="서비스 지역" value={form.serviceRegion} onChange={v => setForm({ ...form, serviceRegion: v })} placeholder="예: 서울 / 온라인" />
            <div className="field">
              <Input
                label="대표 이미지 URL"
                value={form.thumbnailImageUrl}
                onChange={v => setForm({ ...form, thumbnailImageUrl: v })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <FieldArea label="상세 설명" value={form.description} onChange={v => setForm({ ...form, description: v })} />
            <button className="btn btn-primary full">상품 등록</button>
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
          <div className="card market-card" key={x.storeProductId || x.id}>
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
              <Link
                className="market-detail-link"
                to={`/store-products/${x.storeProductId || x.id}`}
              >
                자세히 보기
              </Link>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="panel empty-panel">
        <p className="muted">아직 등록된 서비스가 없습니다.</p>
      </div>
    )}
  </Page>;
}
