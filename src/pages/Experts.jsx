import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Clock3, Filter } from 'lucide-react';

import { api } from '../api/client';
import { CATEGORIES, REGIONS } from '../data/constants';
import { normalizeList } from '../utils/normalizeList';

import { Page } from '../components/common';
import FavoriteToggle from '../components/FavoriteToggle';

export default function Experts() {

  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    locationId: ''
  });

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {

    setMsg('');

    try {

      const params = new URLSearchParams();

      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const res = await api.get(
        '/api/experts/search' +
        (params.toString() ? `?${params.toString()}` : '')
      );

      const normalized = normalizeList(res);

      console.log(normalized);

      setItems(normalized);

    } catch (err) {

      setItems([]);
      setMsg(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Page
      title="고수찾기"
      desc="필요한 서비스와 지역을 선택해 나에게 맞는 고수를 찾아보세요."
    >

      <div className="filter-bar">

        <div className="search-input">

          <Search size={19} />

          <input
            value={filters.keyword}
            onChange={(e) =>
              setFilters({
                ...filters,
                keyword: e.target.value
              })
            }
            placeholder="서비스명이나 고수명을 검색하세요"
          />

        </div>

        <select
          value={filters.categoryId}
          onChange={(e) =>
            setFilters({
              ...filters,
              categoryId: e.target.value
            })
          }
        >

          {CATEGORIES.map((c) => (

            <option value={c.id} key={c.id}>
              {c.name}
            </option>

          ))}

        </select>

        <select
          value={filters.locationId}
          onChange={(e) =>
            setFilters({
              ...filters,
              locationId: e.target.value
            })
          }
        >

          {REGIONS.map((r) => (

            <option value={r.id} key={r.id}>
              {r.name}
            </option>

          ))}

        </select>

        <button
          className="btn btn-primary"
          onClick={load}
        >

          <Filter size={16} />
          검색

        </button>

      </div>

      {msg && (
        <p className="message">
          {msg}
        </p>
      )}

      {items.length ? (

        <div className="expert-grid">

          {items.map((x, i) => (

            <Link
              className="expert-card card"
              to={`/experts/${x.expertServiceId}`}
              key={x.expertServiceId || i}
            >

              <div className="card-row">

                <div className="avatar">
                  {(x.displayName || '고').slice(0, 1)}
                </div>

                <div className="card-actions">

                  <span className="badge">
                    활동중
                  </span>

                  <FavoriteToggle
                    expertId={x.expertProfileId}
                  />

                </div>

              </div>

              <h3>
                {x.serviceTitle || x.displayName || '활동 고수'}
              </h3>

              <p>
                {
                  (
                    x.serviceDescription ||
                    x.introduction ||
                    '소개글을 준비 중입니다.'
                  ).slice(0, 60)
                }
              </p>

              <div className="meta">

                <span>
                  <Star size={14} />
                  {x.rating || '0.0'} ({x.reviewCount || 0})
                </span>

                <span>
                  <MapPin size={14} />
                  {x.mainLocationName || '지역 협의'}
                </span>

                <span>
                  <Clock3 size={14} />
                  경력 {x.careerYears || 0}년
                </span>

              </div>

              <div className="service-category">
                {x.mainCategoryName}
              </div>

              <div className="card-footer">

                <b>
                  {
                    x.price && x.price > 0
                      ? `${x.price.toLocaleString()}원`
                      : '견적 협의'
                  }
                </b>

                <span>
                  상세보기
                </span>

              </div>

            </Link>

          ))}

        </div>

      ) : (

        <div className="panel empty-panel">

          <p className="muted">
            아직 등록된 고수가 없습니다.
          </p>

        </div>

      )}

    </Page>
  );
}