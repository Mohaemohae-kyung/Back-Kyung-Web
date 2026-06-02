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
import ChatList from './pages/ChatList';
import Market from './pages/Market';
import StoreProductDetail from './pages/StoreProductDetail';
import Requests from './pages/Requests';
import Community from './pages/Community';
import CommunityPostDetail from './pages/CommunityPostDetail';
import Chat from './pages/Chat';
import MyPage from './pages/MyPage';
import ExpertRegister from './pages/ExpertRegister';
import RequestDetail from './pages/RequestDetail';
import { ChatSocketProvider } from './components/ChatSocketContext';
import PaymentPage from './pages/PaymentPage';
import StoreProductCheckout from './pages/StoreProductCheckout';
import MockPgPayment from './pages/MockPgPayment';
import BookingDetail from './pages/BookingDetail';
import AIChatbot from './components/AIChatbot';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentPasswordSetup from './pages/PaymentPasswordSetup';

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
      <ChatSocketProvider>
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

            {/* 마켓 상품 결제 */}
            <Route
              path="/store-products/:storeProductId/checkout/:bookingId"
              element={<StoreProductCheckout />}
            />

            {/* Mock PG 결제 화면 */}
            <Route
              path="/mock-pg"
              element={<MockPgPayment />}
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

            {/* 채팅목록 */}
            <Route path="/chat" element={<ChatList />} />

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

            {/* 예약 상세 */}
            <Route
              path="/bookings/:bookingId"
              element={<BookingDetail />}
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

            {/* 결제 비밀번호 설정 */}
            <Route
              path="/mypage/payment-password"
              element={
                user ? (
                  <PaymentPasswordSetup />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* 고수 등록 */}
            <Route
              path="/expert/register"
              element={<ExpertRegister />}
            />

            {/* 결제 화면 */}
            <Route path="/payments/:paymentId" element={<PaymentPage />} />

            <Route path="/payment/success" element={<PaymentSuccess />} />

          </Routes>

        </main>

        <Footer />
        <AIChatbot />
      </ChatSocketProvider>          
    </BrowserRouter>
  );
}