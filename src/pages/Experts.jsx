import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Star,
  MapPin,
  Clock3,
  Filter
} from 'lucide-react';

import { api } from '../api/client';

import {
  SERVICE_CATEGORY_GROUPS,
  LOCATION_GROUPS
} from '../data/constants';

import { normalizeList } from '../utils/normalizeList';

import { Page } from '../components/common';

import FavoriteToggle from '../components/FavoriteToggle';

export default function Experts() {

  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    locationId: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    keyword: '',
    categoryId: '',
    locationId: ''
  });

  const [items, setItems] = useState([]);

  const [msg, setMsg] = useState('');

  const [loading, setLoading] = useState(false);

  const load = async () => {

    setMsg('');
    setLoading(true);

    try {

      const res = await api.get(
        '/api/experts/search'
      );

      const normalized = normalizeList(res);

      console.log('고수 목록:', normalized);

      setItems(normalized);

    } catch (err) {

      console.error(err);

      setItems([]);

      setMsg(
        err?.response?.data?.message ||
        err?.message ||
        '고수 목록을 불러오지 못했습니다.'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateFilter = (name, value) => {

    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));

  };

  const handleSearch = () => {

    setAppliedFilters({
      ...filters
    });

  };

  const handleKeyDown = (e) => {

    if (e.key === 'Enter') {
      handleSearch();
    }

  };

  const visibleItems = useMemo(() => {

    const keyword =
      appliedFilters.keyword
        .trim()
        .toLowerCase();

    return items.filter((expert) => {

      const searchText = [

        expert.displayName,
        expert.serviceTitle,
        expert.serviceDescription,
        expert.introduction,
        expert.mainCategoryName,
        expert.mainLocationName

      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesKeyword =
        !keyword ||
        searchText.includes(keyword);

      /* =========================
         카테고리 필터
         ========================= */

      let matchesCategory = true;

      if (appliedFilters.categoryId) {

        const selectedCategory =
          SERVICE_CATEGORY_GROUPS.find(
            c =>
              String(c.id) ===
              String(appliedFilters.categoryId)
          );

        const childNames =
          selectedCategory?.children?.map(
            child => child.name
          ) || [];

        matchesCategory =

          childNames.includes(
            expert.mainCategoryName
          ) ||

          expert.mainCategoryName ===
            selectedCategory?.name;
      }

      /* =========================
         지역 필터
         ========================= */

      let matchesLocation = true;

      if (appliedFilters.locationId) {

        const selectedLocation =
          LOCATION_GROUPS.find(
            l =>
              String(l.id) ===
              String(appliedFilters.locationId)
          );

        const childNames =
          selectedLocation?.children?.map(
            child => child.name
          ) || [];

        matchesLocation =

          childNames.includes(
            expert.mainLocationName
          ) ||

          expert.mainLocationName ===
            selectedLocation?.name ||

          expert.mainLocationName?.includes(
            selectedLocation?.name
          );
      }

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesLocation
      );

    });

  }, [
    items,
    appliedFilters
  ]);

  const hasActiveFilter =

    appliedFilters.keyword ||

    appliedFilters.categoryId ||

    appliedFilters.locationId;

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
              updateFilter(
                'keyword',
                e.target.value
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="서비스명이나 고수명을 검색하세요"
          />

        </div>

        {/* 카테고리 */}

        <select
          value={filters.categoryId}
          onChange={(e) =>
            updateFilter(
              'categoryId',
              e.target.value
            )
          }
        >

          <option value="">
            전체 카테고리
          </option>

          {SERVICE_CATEGORY_GROUPS.map((category) => (

            <option
              value={category.id}
              key={category.id}
            >
              {category.name}
            </option>

          ))}

        </select>

        {/* 지역 */}

        <select
          value={filters.locationId}
          onChange={(e) =>
            updateFilter(
              'locationId',
              e.target.value
            )
          }
        >

          <option value="">
            전체 지역
          </option>

          {LOCATION_GROUPS.map((region) => (

            <option
              value={region.id}
              key={region.id}
            >
              {region.name}
            </option>

          ))}

        </select>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading}
        >

          <Filter size={16} />

          {loading ? '검색중...' : '검색'}

        </button>

      </div>

      {msg && (

        <p className="message">
          {msg}
        </p>

      )}

      {loading ? (

        <div className="panel empty-panel">

          <p className="muted">
            고수 정보를 불러오는 중입니다...
          </p>

        </div>

      ) : visibleItems.length ? (

        <div className="expert-grid">

          {visibleItems.map((expert, i) => (

            <Link
              className="expert-card card"
              to={`/experts/${expert.expertServiceId}`}
              key={expert.expertServiceId || i}
            >

              <div className="card-row">

                <div className="avatar">
                  {(expert.displayName || '고')
                    .slice(0, 1)}
                </div>

                <div className="card-actions">

                  <span className="badge">
                    활동중
                  </span>

                  <FavoriteToggle
                    expertId={
                      expert.expertProfileId
                    }
                  />

                </div>

              </div>

              <h3>
                {
                  expert.serviceTitle ||
                  expert.displayName ||
                  '활동 고수'
                }
              </h3>

              <p>
                {
                  (
                    expert.serviceDescription ||

                    expert.introduction ||

                    '소개글을 준비 중입니다.'
                  ).slice(0, 60)
                }
              </p>

              <div className="meta">

                <span>

                  <Star size={14} />

                  {expert.rating || '0.0'}

                  ({expert.reviewCount || 0})

                </span>

                <span>

                  <MapPin size={14} />

                  {
                    expert.mainLocationName ||
                    '지역 협의'
                  }

                </span>

                <span>

                  <Clock3 size={14} />

                  경력 {expert.careerYears || 0}년

                </span>

              </div>

              <div className="service-category">

                {
                  expert.mainCategoryName ||
                  '카테고리 미지정'
                }

              </div>

              <div className="card-footer">

                <b>

                  {
                    expert.price &&
                    Number(expert.price) > 0

                      ? `${Number(expert.price)
                          .toLocaleString()}원`

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

            {hasActiveFilter

              ? '검색 조건에 맞는 고수가 없습니다.'

              : '아직 등록된 고수가 없습니다.'}

          </p>

        </div>

      )}

    </Page>

  );
}