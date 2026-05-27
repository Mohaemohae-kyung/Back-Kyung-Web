import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  HeartHandshake,
  Menu,
  X,
  LogOut
} from 'lucide-react';

import { useChatSocket }
  from '../components/ChatSocketContext';

export default function Header({
  user,
  logout
}) {

  const [open, setOpen] =
    useState(false);

  const { totalUnread } =
    useChatSocket();

  const nav = [
    ['/', '홈'],
    ['/experts', '고수찾기'],
    ['/market', '마켓'],
    ['/requests', '요청관리'],
    [
      '/chat',
      totalUnread > 0
        ? `채팅(${totalUnread})`
        : '채팅'
    ],
    ['/community', '커뮤니티'],
    ['/mypage', '마이페이지']
  ];

  const close = () =>
    setOpen(false);

  return (
    <header className="topbar">
      <div className="container nav-wrap">

        <Link
          className="brand"
          to="/"
          onClick={close}
        >
          <span className="brand-icon">
            <HeartHandshake size={24} />
          </span>

          <div>
            <b>매칭온</b>
            <small>
              생활서비스 매칭 플랫폼
            </small>
          </div>
        </Link>

        <nav
          className={
            open
              ? 'site-nav open'
              : 'site-nav'
          }
        >
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="auth-area">

          {user ? (
            <>
              <div className="header-user">

                <div className="header-avatar">

                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="프로필"
                      className="header-avatar-image"
                    />
                  ) : (
                    (user.nickname || user.name || 'U')
                      .slice(0, 1)
                  )}

                </div>

                <span className="hello">
                  {
                    user.nickname ||
                    user.name ||
                    '사용자'
                  }님
                </span>

              </div>

              <button
                className="btn btn-ghost"
                onClick={logout}
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-ghost"
                to="/login"
              >
                로그인
              </Link>

              <Link
                className="btn btn-primary"
                to="/signup"
              >
                회원가입
              </Link>
            </>
          )}

        </div>

        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label="메뉴"
        >
          {open
            ? <X size={22} />
            : <Menu size={22} />
          }
        </button>

      </div>
    </header>
  );
}