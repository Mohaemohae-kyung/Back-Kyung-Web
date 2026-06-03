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
import PortfolioGallery from '../components/PortfolioGallery';

export default function ExpertDetail() {

  const { serviceId } = useParams();

  const [expert, setExpert] = useState(null);

  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    content: '',
    budget: '',
    preferredDate: ''
  });

  const [done, setDone] = useState(false);

  const [msg, setMsg] = useState('');

  // =========================
  // 로그인 유저
  // =========================
  const loginUser =
    JSON.parse(localStorage.getItem('user'));

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

      if (!form.categoryId) {

        setMsg('서비스를 선택해주세요.');

        return;
      }

      await api.post('/api/service-requests', {

        expertProfileId:
          expert.expertProfileId,

        categoryId:
          form.categoryId
            ? Number(form.categoryId)
            : null,

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

  // =========================
  // 본인 게시물 여부
  // =========================
  const isMine =
    loginUser?.userId &&
    expert.ownerUserId &&
    String(loginUser.userId) === String(expert.ownerUserId);

  return (

    <Page
      title="고수 프로필"
      desc="소개와 활동 정보를 확인한 뒤 견적을 요청해보세요."
    >

      {msg && <p className="message">{msg}</p>}

      <div className="detail-layout">

        <div className="panel profile-panel new-profile">

          {/* 상단 */}
          <div className="new-profile-top">

            <div className="avatar large">

              {expert.userProfileImageUrl ? (

                <img
                  src={expert.userProfileImageUrl}
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

            <div className="top-info">

              <span className="badge">
                검증된 고수
              </span>

              <div className="name-row">

                <h2>
                  {expert.displayName || '활동 고수'}
                </h2>

                <p className="profile-meta">
                  경력 : {expert.careerYears || 0}년
                  {' '}
                  평점 : {expert.rating || '0.0'}
                </p>

              </div>

            </div>

          </div>

          <div className="new-profile-body">

            {/* 소개 */}
            <div className="intro-box">

              {expert.expertProfileImageUrl && (

                <div className="expert-intro-image">

                  <img
                    src={expert.expertProfileImageUrl}
                    alt="고수 프로필 이미지"
                  />

                </div>

              )}

              <h3>고수 소개</h3>

              <p>
                {
                  expert.introduction ||
                  expert.serviceDescription ||
                  '소개글이 없습니다.'
                }
              </p>

            </div>

            <div className="bottom-detail-row">

              {/* 서비스 목록 */}
              <div className="service-box">

                <div className="info-card">

                  <span>
                    <BriefcaseBusiness size={20} />
                  </span>

                  <small>서비스 분야</small>

                  <b>
                    {
                      expert.categoryNames?.length > 0
                        ? expert.categoryNames.join(', ')
                        : '서비스 협의'
                    }
                  </b>

                </div>

              </div>

              <div className="side-info-column">

                <div className="info-card">

                  <span>
                    <ShieldCheck size={20} />
                  </span>

                  <small>진행 방식</small>

                  <b>채팅 상담 후 일정 확정</b>

                </div>

                <div className="info-card">

                  <span>
                    <MapPin size={20} />
                  </span>

                  <small>활동 지역</small>

                  <b>
                    {expert.mainLocationName || '지역 협의'}
                  </b>

                </div>

              </div>

            </div>

          </div>

          {expert.portfolioWebViewUrl && (
            <PortfolioGallery urlPath={expert.portfolioWebViewUrl} />
          )}

        </div>

        {
          isMine ? (

            <aside className="panel quote-panel">

              <div className="quote-head">

                <div>

                  <h3>내 고수 프로필</h3>

                  <p>
                    내가 등록한 고수 프로필입니다.
                    프로필 정보와 제공 서비스를 수정할 수 있어요.
                  </p>

                </div>

              </div>

              <Link
                className="btn btn-primary full"
                to="/expert/register?mode=edit"
              >
                고수 프로필 수정
              </Link>

            </aside>

          ) : (

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

                      <div className="field">

                        <label className="field-label">
                          서비스 선택
                        </label>

                        <select
                          className="service-select"
                          value={form.categoryId || ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              categoryId:
                                e.target.value
                            })
                          }
                        >

                          <option value="">
                            서비스 선택
                          </option>

                          {expert.categoryNames?.map((name, idx) => (

                            <option
                              key={expert.expertServiceIds?.[idx]}
                              value={expert.categoryIds?.[idx]}
                            >
                              {name}
                            </option>

                          ))}

                        </select>

                      </div>

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
          )
        }

      </div>

    </Page>
  );
}
