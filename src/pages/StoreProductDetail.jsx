import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client';

export default function StoreProductDetail() {
  const { storeProductId } = useParams();
  const [product, setProduct] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const load = async () => {
      try {
        const res = await api.get(`/api/store-products/${storeProductId}`);
        setProduct(res.result);
      } catch (err) {
        setMsg(err.message || '상품 정보를 불러오지 못했습니다.');
      }
    };

    load();
  }, [storeProductId]);

  if (msg) {
    return (
      <section className="container page">
        <div className="panel">
          <p className="error-text">{msg}</p>
          <Link to="/market" className="btn">마켓으로 돌아가기</Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container page">
        <div className="panel">
          <p className="muted">상품 정보를 불러오는 중입니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container page store-detail-page">
      <div className="store-detail-layout">
        <div className="store-detail-main">
          <div className="panel store-detail-hero">
            {product.thumbnailImageUrl ? (
              <img
                src={product.thumbnailImageUrl}
                alt={product.title}
                className="store-detail-image"
              />
            ) : (
              <div className="store-detail-image empty">
                이미지 없음
              </div>
            )}

            <div className="store-detail-title">
              <span className="badge">
                {product.categoryName || '마켓 상품'}
              </span>
              <h1>{product.title}</h1>
              <p className="muted">
                {product.serviceType || '진행 방식 미정'} · {product.serviceRegion || '지역 미정'}
              </p>
            </div>
          </div>

          <div className="panel store-detail-section">
            <h2>상세 설명</h2>
            <p className="store-detail-description">
              {product.description || '등록된 상세 설명이 없습니다.'}
            </p>
          </div>

          <div className="panel store-detail-section">
            <h2>서비스 정보</h2>

            <div className="info-grid">
              <div className="info-card">
                <small>진행 방식</small>
                <b>{product.serviceType || '-'}</b>
              </div>

              <div className="info-card">
                <small>서비스 지역</small>
                <b>{product.serviceRegion || '-'}</b>
              </div>

              <div className="info-card">
                <small>가격</small>
                <b>{Number(product.price || 0).toLocaleString()}원</b>
              </div>
            </div>
          </div>

          {product.expertProfileId && (
            <div className="panel store-detail-section">
              <h2>고수 정보</h2>
              <p className="muted">
                이 상품을 등록한 고수의 프로필을 확인할 수 있어요.
              </p>
              <Link to={`/experts/${product.expertProfileId}`} className="btn">
                고수 프로필 보기
              </Link>
            </div>
          )}
        </div>

        <aside className="panel store-detail-side">
          <p className="muted">서비스 가격</p>
          <h2>{Number(product.price || 0).toLocaleString()}원</h2>

          <div className="side-info">
            <span>진행 방식</span>
            <b>{product.serviceType || '-'}</b>
          </div>

          <div className="side-info">
            <span>지역</span>
            <b>{product.serviceRegion || '-'}</b>
          </div>

          <button className="btn btn-primary full">
            예약하기
          </button>

          <button className="btn full">
            문의하기
          </button>

          <Link to="/market" className="market-back-link">
            마켓으로 돌아가기
          </Link>
        </aside>
      </div>
    </section>
  );
}