import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  BriefcaseBusiness,
  MapPin,
  ShieldCheck,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

import { api } from '../api/client';

import {
  Page,
  Info,
  Input,
  FieldArea
} from '../components/common';

import FavoriteToggle from '../components/FavoriteToggle';

export default function ExpertDetail() {

  const { serviceId } = useParams();

  const [expert, setExpert] = useState(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    budget: '',
    preferredDate: ''
  });

  const [done, setDone] = useState(false);

  const [msg, setMsg] = useState('');

  useEffect(() => {

    api.get(`/api/experts/${serviceId}`)

      .then(res => {

        setExpert(res.result || res);
      })

      .catch(err => {

        setExpert(null);

        setMsg(err.message);
      });

  }, [serviceId]);

  const submit = async (e) => {

    e.preventDefault();

    setMsg('');

    try {

      const preferredDate =
        form.preferredDate
          ? form.preferredDate.length === 16
            ? `${form.preferredDate}:00`
            : form.preferredDate
          : null;

      const budget =
        form.budget === ''
          ? null
          : Number(
              String(form.budget)
                .replace(/[^0-9]/g, '')
            );

      await api.post('/api/service-requests', {

        expertServiceId:
          expert.expertServiceId || Number(serviceId),

        title: form.title,

        content: form.content,

        budget,

        preferredDate
      });

      setDone(true);

    } catch (err) {

      setMsg(
        err.message || '견적 요청에 실패했어요.'
      );
    }
  };

  if (!expert) {

    return (
      <Page
        title="고수 프로필"
        desc="DB에 저장된 고수 정보를 불러옵니다."
      >

        {
          msg
            ? <p className="message">{msg}</p>
            : <p className="muted">불러오는 중입니다.</p>
        }

      </Page>
    );
  }

  return (

    <Page
      title="고수 프로필"
      desc="소개와 활동 정보를 확인한 뒤 견적을 요청해보세요."
    >

      {msg && <p className="message">{msg}</p>}

      <div className="detail-layout">

        <div className="panel profile-panel">

          <div className="profile-top">

            <div className="avatar large">
              {(expert.displayName || '고').slice(0, 1)}
            </div>

            <div>

              <span className="badge">
                검증된 고수
              </span>

              <h2>
                {expert.serviceTitle || expert.displayName || '활동 고수'}
              </h2>

              <p>
                {
                  expert.serviceDescription ||
                  expert.introduction ||
                  '소개글을 준비 중입니다.'
                }
              </p>

            </div>

          </div>

          <div className="profile-stats">

            <div>
              <b>{expert.rating || '0.0'}</b>
              <span>평점</span>
            </div>

            <div>
              <b>{expert.reviewCount || 0}</b>
              <span>후기</span>
            </div>

            <div>
              <b>{expert.careerYears || 0}년</b>
              <span>경력</span>
            </div>

          </div>

          <div className="info-grid">

            <Info
              icon={<BriefcaseBusiness />}
              label="서비스 분야"
              value={expert.mainCategoryName || '서비스 협의'}
            />

            <Info
              icon={<MapPin />}
              label="활동 지역"
              value={expert.mainLocationName || '지역 협의'}
            />

            <Info
              icon={<ShieldCheck />}
              label="진행 방식"
              value="채팅 상담 후 일정 확정"
            />

            <Info
              icon={<CreditCard />}
              label="예상 금액"
              value={
                expert.price && expert.price > 0
                  ? `${expert.price.toLocaleString()}원`
                  : '견적 협의'
              }
            />

          </div>

          <div className="profile-section">

            <h3>서비스 소개</h3>

            <p>
              {
                expert.serviceDescription ||
                expert.introduction ||
                '서비스 소개가 아직 등록되지 않았습니다.'
              }
            </p>

          </div>

        </div>

        <aside className="panel quote-panel">

          <div className="quote-head">

            <div>

              <h3>견적 요청하기</h3>

              <p>
                필요한 내용을 남기면
                고수가 확인 후 응답합니다.
              </p>

            </div>

            <FavoriteToggle
              expertId={
                expert.expertProfileId || serviceId
              }
              label
            />

          </div>

          {
            done

              ? (

                <div className="done-box">

                  <CheckCircle2 size={34} />

                  <h3>견적 요청 완료</h3>

                  <p>
                    요청관리에서 진행 상태를
                    확인할 수 있어요.
                  </p>

                  <Link
                    className="btn btn-primary"
                    to="/requests"
                  >
                    요청관리로 이동
                  </Link>

                </div>

              )

              : (

                <form
                  className="form"
                  onSubmit={submit}
                >

                  <Input
                    label="요청 제목"
                    value={form.title}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        title: v
                      })
                    }
                    placeholder="예: 자소서 첨삭 요청"
                  />

                  <FieldArea
                    label="요청 내용"
                    value={form.content}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        content: v
                      })
                    }
                    placeholder="필요한 서비스, 일정, 현재 상황을 적어주세요."
                  />

                  <Input
                    label="희망 예산"
                    value={form.budget}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        budget: v
                      })
                    }
                    placeholder="예: 3만원 내외"
                  />

                  <Input
                    label="희망 일정"
                    type="datetime-local"
                    value={form.preferredDate}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        preferredDate: v
                      })
                    }
                  />

                  <button className="btn btn-primary full">
                    견적 요청 보내기
                  </button>

                </form>
              )
          }

        </aside>

      </div>

    </Page>
  );
}