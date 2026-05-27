import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Star,
  ChevronRight,
  BriefcaseBusiness,
  GraduationCap,
  Paintbrush,
  HomeIcon,
  Wrench
} from 'lucide-react';

import { api } from '../api/client';
import { CATEGORIES, REGIONS } from '../data/constants';
import { normalizeList } from '../utils/normalizeList';

import { SectionTitle } from '../components/common';

export default function Home() {

  const [recommended, setRecommended] = useState([]);

  useEffect(() => {

    api.get('/api/experts/search')

      .then(res => {

        const normalized = normalizeList(res);

        setRecommended(normalized.slice(0, 3));

      })

      .catch(() => setRecommended([]));

  }, []);

  return (
    <>

      <section className="hero">

        <div className="container hero-inner">

          <div className="hero-copy">

            <span className="eyebrow">
              <Sparkles size={15} />
              원하는 고수를 빠르게 만나는 방법
            </span>

            <h1>
              필요한 서비스를
              <br />
              고수에게 바로 요청하세요
            </h1>

            <p>
              분야와 지역을 선택하고,
              마음에 드는 고수에게 견적을 요청해보세요.
            </p>

            <div className="search-card">

              <div className="search-input">

                <Search size={20} />

                <input placeholder="필요한 서비스를 검색해보세요" />

              </div>

              <select defaultValue="">
                <option value="">전체 서비스</option>

                {CATEGORIES.slice(1).map(c => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}

              </select>

              <select defaultValue="">

                <option value="">전체 지역</option>

                {REGIONS.slice(1).map(r => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}

              </select>

              <Link
                className="btn btn-primary"
                to="/experts"
              >
                검색
              </Link>

            </div>

            <div className="hero-tags">

              {
                [
                  '자소서 첨삭',
                  '코딩 과외',
                  '로고 디자인',
                  '번역',
                  '생활 도움'
                ].map(x => (

                  <Link to="/experts" key={x}>
                    {x}
                  </Link>

                ))
              }

            </div>

          </div>

          <div className="hero-panel panel">

            <div className="panel-head">

              <div>
                <b>오늘의 추천 고수</b>
                <span>지금 바로 상담 가능한 고수</span>
              </div>

              <Link to="/experts">
                전체보기
              </Link>

            </div>

            <div className="recommend-list">

              {
                recommended.length
                  ? recommended.map((x, i) => (

                    <ExpertMini
                      key={x.expertServiceId || i}
                      expert={x}
                    />

                  ))
                  : (
                    <p className="muted">
                      아직 등록된 고수가 없습니다.
                    </p>
                  )
              }

            </div>

          </div>

        </div>

      </section>

      <section className="container section">

        <SectionTitle
          title="인기 서비스"
          desc="가장 많이 찾는 분야를 골라 바로 고수를 찾아보세요."
        />

        <div className="category-grid">

          <CategoryCard
            icon={<BriefcaseBusiness />}
            title="취업/직무"
            desc="자소서, 면접, 포트폴리오"
          />

          <CategoryCard
            icon={<GraduationCap />}
            title="과외"
            desc="전공, 코딩, 자격증"
          />

          <CategoryCard
            icon={<Paintbrush />}
            title="디자인/외주"
            desc="로고, 웹, 상세페이지"
          />

          <CategoryCard
            icon={<HomeIcon />}
            title="생활 도움"
            desc="정리, 심부름, 번역"
          />

          <CategoryCard
            icon={<Wrench />}
            title="수리/설치"
            desc="간단 수리, 설치 상담"
          />

        </div>

      </section>

      <section className="container section">

        <SectionTitle
          title="이용 흐름"
          desc="복잡한 요청 등록 없이 고수 상세 페이지에서 바로 견적 요청을 보낼 수 있어요."
        />

        <div className="step-grid">

          <Step
            n="01"
            title="고수 찾기"
            text="분야와 지역으로 고수를 검색합니다."
          />

          <Step
            n="02"
            title="프로필 확인"
            text="경력, 소개, 활동 지역을 비교합니다."
          />

          <Step
            n="03"
            title="견적 요청"
            text="필요한 내용을 작성해 요청합니다."
          />

          <Step
            n="04"
            title="채팅 상담"
            text="고수가 수락하면 채팅으로 조율합니다."
          />

        </div>

      </section>

      <section className="container section cta-panel">

        <div>

          <h2>
            고수로 활동하고 싶나요?
          </h2>

          <p>
            전문 분야와 활동 지역을 등록하고
            고객의 요청을 받아보세요.
          </p>

        </div>

        <Link
          className="btn btn-primary"
          to="/expert/register"
        >
          고수 서비스 등록
        </Link>

      </section>

    </>
  );
}

function ExpertMini({ expert }) {

  return (

    <Link
      className="expert-mini"
      to={`/experts/${expert.expertServiceId}`}
    >

      <div className="avatar">

        {expert.profileImageUrl ? (

          <img
            src={expert.profileImageUrl}
            alt="프로필"
            className="profile-image"
          />

        ) : (

          <span>
            {(expert.displayName || '고')
              .slice(0, 1)}
          </span>

        )}

      </div>

      <div className="mini-body">

        <b>
          {expert.serviceTitle || expert.displayName || '활동 고수'}
        </b>

        <p>
          {
            expert.serviceDescription ||
            expert.introduction ||
            '소개글을 준비 중입니다.'
          }
        </p>

        <span>

          <Star size={14} />

          {expert.rating || '0.0'}

          {' · '}

          {expert.mainCategoryName || '서비스 협의'}

          {' · '}

          {expert.mainLocationName || '지역 협의'}

        </span>

      </div>

    </Link>
  );
}

function CategoryCard({ icon, title, desc }) {

  return (
    <Link className="category-card" to="/experts">

      <span>{icon}</span>

      <h3>{title}</h3>

      <p>{desc}</p>

      <ChevronRight size={18} />

    </Link>
  );
}

function Step({ n, title, text }) {

  return (
    <div className="step-card">

      <b>{n}</b>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}