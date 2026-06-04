import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import e2eCrypto from '../utils/e2eCrypto';
import { api } from '../api/client';
import { Page } from '../components/common';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { ShieldCheck } from 'lucide-react';
import './PaymentPasswordSetup.css';

export default function PaymentPasswordChange() {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [step, setStep] = useState(1); 
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  
  const [rsaPublicKey, setRsaPublicKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keyError, setKeyError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const navigate = useNavigate();

  const initializeData = async () => {
    setLoading(true);
    setKeyError(false);

    try {
      const res = await api.get(`/api/payments/public-key?t=${Date.now()}`);
      let pubKey = res?.publicKey || res?.data?.publicKey || res;
      if (typeof pubKey === 'object' && pubKey.publicKey) {
        pubKey = pubKey.publicKey;
      }
      if (typeof pubKey === 'string' && pubKey.includes('BEGIN PUBLIC KEY')) {
        setRsaPublicKey(pubKey);
      } else {
        throw new Error("Invalid public key format received");
      }
    } catch (error) {
      console.error('공개키 로딩 실패:', error);
      setKeyError(true);
      setLoading(false);
      return; 
    }

    try {
      const userInfoRes = await api.get('/api/users/me');
      const result = userInfoRes?.result || userInfoRes?.data?.result || userInfoRes;

      if (result && result.userId) {
        setCurrentUserId(result.userId);
        
        // 데이터 로딩 완료 즉시 키보드 활성화 (버튼 클릭 생략)
        setShowKeyboard(true);
      } else {
        throw new Error("응답 데이터에서 사용자 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 실패:', error);
      setKeyError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const getKeyboardTitle = () => {
    if (step === 1) return "현재 결제 비밀번호 입력";
    if (step === 2) return "새 결제 비밀번호 6자리 입력";
    return "새 결제 비밀번호 다시 한 번 입력";
  };

  const handlePinComplete = async (pin) => {
    if (step === 1) {
      try {
        if (!rsaPublicKey || !currentUserId) {
          alert("보안 연결 또는 사용자 정보를 확인할 수 없습니다.");
          return;
        }

        const payload = {
          userId: currentUserId,
          currentPin: pin
        };

        // 현재 비밀번호 실시간 단독 검증
        const encryptedPayload = e2eCrypto.encryptPayload(payload, rsaPublicKey);
        await api.post('/api/payments/password/verify', encryptedPayload);

        setCurrentPin(pin);
        setStep(2);
        setShowKeyboard(false);
        setTimeout(() => setShowKeyboard(true), 300);
      } catch (err) {
        console.error("비밀번호 검증 실패:", err);
        const errMsg = err.response?.data?.message || err.message || "비밀번호가 일치하지 않습니다.";
        alert(errMsg);
        
        setShowKeyboard(false);
        setTimeout(() => setShowKeyboard(true), 300);
      }
    } else if (step === 2) {
      if (currentPin === pin) {
        alert("새 비밀번호는 기존 비밀번호와 달라야 합니다.");
        setStep(2);
        setShowKeyboard(false);
        setTimeout(() => setShowKeyboard(true), 300);
        return;
      }
      setNewPin(pin);
      setStep(3);
      setShowKeyboard(false);
      setTimeout(() => setShowKeyboard(true), 300);
    } else {
      if (pin !== newPin) {
        alert("새 비밀번호가 일치하지 않습니다.");
        setStep(2);
        setNewPin("");
        setShowKeyboard(false);
        setTimeout(() => setShowKeyboard(true), 300);
        return;
      }

      try {
        if (!rsaPublicKey || !currentUserId) {
          alert("보안 연결 또는 사용자 정보를 확인할 수 없습니다.");
          return;
        }

        const payload = {
          userId: currentUserId,
          currentPin,
          newPin: pin
        };

        const encryptedPayload = e2eCrypto.encryptPayload(payload, rsaPublicKey);
        await api.post('/api/payments/password/change', encryptedPayload);
        
        alert("결제 비밀번호가 성공적으로 변경되었습니다.");
        navigate(-1);
      } catch (err) {
        console.error("비밀번호 변경 실패:", err);
        const errMsg = err.response?.data?.message || err.message || "비밀번호 변경 중 오류가 발생했습니다.";
        alert(errMsg);
        
        setStep(1);
        setCurrentPin("");
        setNewPin("");
        setShowKeyboard(false);
        setTimeout(() => setShowKeyboard(true), 300);
      }
    }
  };

  return (
    <Page title="결제 비밀번호 변경" desc="안전한 결제를 위해 새로운 6자리 비밀번호를 설정해주세요.">
      <div className="mypage-grid">
        <section className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShieldCheck size={48} color="#00c7ae" style={{ marginBottom: '16px' }} />
          <h2>결제 비밀번호 변경</h2>
          <p className="muted" style={{ marginBottom: '30px' }}>E2E 암호화를 통해 고객님의 비밀번호를 안전하게 보호합니다.</p>
          
          {loading ? (
            <p style={{ color: '#666' }}>보안 연결을 설정하는 중입니다...</p>
          ) : keyError ? (
            <div>
              <p style={{ color: 'red', marginBottom: '12px' }}>보안 연결에 실패했습니다.</p>
              <button className="btn btn-outline" onClick={initializeData}>
                다시 시도
              </button>
            </div>
          ) : (
            <p style={{ color: '#3182f6', fontWeight: 'bold' }}>
              화면 하단의 키보드를 통해 비밀번호를 입력해주세요.
            </p>
          )}
        </section>
      </div>

      {showKeyboard && (
        <VirtualKeyboard 
          title={getKeyboardTitle()}
          onClose={() => navigate(-1)}
          onComplete={handlePinComplete}
        />
      )}
    </Page>
  );
}