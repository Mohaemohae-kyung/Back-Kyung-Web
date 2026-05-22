import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { api, getStoredUser, clearAuth } from './api/client';
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
import Admin from './pages/Admin';

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}

    clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Header user={user} logout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/experts/:serviceId" element={<ExpertDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/store-products/:storeProductId" element={<StoreProductDetail />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/posts/:postId" element={<CommunityPostDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/expert/register" element={<ExpertRegister />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
