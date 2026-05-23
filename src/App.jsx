import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import {
  api,
  getStoredUser,
  clearAuth
} from './api/client';

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Experts from './pages/Experts';
import ExpertDetail from './pages/ExpertDetail';
import Market from './pages/Market';
import StoreProductDetail from './pages/StoreProductDetail';
import Requests from './pages/Requests';
import Community from './pages/Community';
import CommunityPostDetail from './pages/CommunityPostDetail';
import Chat from './pages/Chat';
import MyPage from './pages/MyPage';
import ExpertRegister from './pages/ExpertRegister';
import RequestDetail from './pages/RequestDetail';

export default function App() {

  const [user, setUser] =
    useState(getStoredUser());

  const logout = async () => {

    try {

      await api.post(
        '/api/auth/logout'
      );

    } catch {}

    clearAuth();

    setUser(null);

    window.location.href = '/';
  };

  return (

    <BrowserRouter>

      <Header
        user={user}
        logout={logout}
      />

      <main>

        <Routes>

          {/* 홈 */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* 로그인 */}
          <Route
            path="/login"
            element={
              <Login setUser={setUser} />
            }
          />

          {/* 회원가입 */}
          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* 고수찾기 */}
          <Route
            path="/experts"
            element={<Experts />}
          />

          {/* 고수 상세 */}
          <Route
            path="/experts/:serviceId"
            element={<ExpertDetail />}
          />

          {/* 마켓 */}
          <Route
            path="/market"
            element={<Market />}
          />

          {/* 상품 상세 */}
          <Route
            path="/store-products/:storeProductId"
            element={<StoreProductDetail />}
          />

          {/* 요청관리 */}
          <Route
            path="/requests"
            element={<Requests />}
          />

          {/* 요청 상세 */}
          <Route
            path="/requests/:id"
            element={<RequestDetail />}
          />

          {/* 커뮤니티 */}
          <Route
            path="/community"
            element={<Community />}
          />

          {/* 커뮤니티 상세 */}
          <Route
            path="/community/posts/:postId"
            element={<CommunityPostDetail />}
          />

          {/* /chat 직접 접근 시 요청관리 이동 */}
          <Route
            path="/chat"
            element={
              <Navigate to="/requests" />
            }
          />

          {/* 채팅방 */}
          <Route
            path="/chat/:roomId"
            element={<Chat />}
          />

          {/* 마이페이지 */}
          <Route
            path="/mypage"
            element={<MyPage />}
          />

          {/* 고수 등록 */}
          <Route
            path="/expert/register"
            element={<ExpertRegister />}
          />

        </Routes>

      </main>

      <Footer />

    </BrowserRouter>
  );
}