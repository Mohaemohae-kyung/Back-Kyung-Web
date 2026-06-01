import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import e2eCrypto from '../utils/e2eCrypto';
import { api } from '../api/client';
import VirtualKeyboard from '../components/VirtualKeyboard';
import './PaymentPasswordSetup.css';

export default function PaymentPasswordSetup() {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [step, setStep] = useState(1); // 1: set, 2: confirm
  const [firstPin, setFirstPin] = useState("");
  const [rsaPublicKey, setRsaPublicKey] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const res = await api.get(`/api/payments/public-key?t=${Date.now()}`);
        setRsaPublicKey(res?.publicKey || res?.data?.publicKey || res);
      } catch (error) {
        console.error('공개키 로딩 실패:', error);
      }
    };
    fetchPublicKey();
  }, []);

  const handlePinComplete = async (pin) => {
    if (step === 1) {
      setFirstPin(pin);
      setStep(2);
      setShowKeyboard(false);
      setTimeout(() => setShowKeyboard(true), 300); // Re-open for confirm
    } else {
      if (pin !== firstPin) {
        alert("비밀번호가 일치하지 않습니다. 처음부터 다시 시도해주세요.");
        setStep(1);
        setFirstPin("");
        setShowKeyboard(false);
        return;
      }

      // 2번 모두 일치하면 E2E 암호화 후 서버로 전송
      try {
        if (!rsaPublicKey) {
            alert("보안 연결(키 교환)이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const userInfo = await api.get('/api/users/me');
        const userId = userInfo.data?.result?.userId || userInfo.data?.userId || userInfo.result?.userId || userInfo.userId;

        const payload = {
          userId,
          paymentPin: pin
        };

        const encryptedPayload = e2eCrypto.encryptPayload(payload, rsaPublicKey);
        
        await api.post('http://100.104.59.126:4000/api/payments/password/setup', encryptedPayload);
        
        alert("결제 비밀번호가 성공적으로 설정되었습니다.");
        navigate(-1); // 이전 페이지로 돌아가기
      } catch (err) {
        console.error("비밀번호 설정 실패:", err);
        alert("비밀번호 설정 중 오류가 발생했습니다.");
      } finally {
        setShowKeyboard(false);
      }
    }
  };

  return (
    <div className="password-setup-container">
      <h2>결제 비밀번호 설정</h2>
      <p>안전한 결제를 위해 6자리 비밀번호를 설정해주세요.</p>
      <button 
        className="setup-button"
        onClick={() => { setStep(1); setShowKeyboard(true); }}
      >
        비밀번호 {step === 1 ? '입력' : '재입력'} 하기
      </button>

      {showKeyboard && (
        <VirtualKeyboard 
          title={step === 1 ? "새 결제 비밀번호 6자리 입력" : "비밀번호 다시 한 번 입력"}
          onClose={() => setShowKeyboard(false)}
          onComplete={handlePinComplete}
        />
      )}
    </div>
  );
}
