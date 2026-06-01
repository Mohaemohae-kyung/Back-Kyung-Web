import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import e2eCrypto from '../utils/e2eCrypto';
import { api } from '../api/client';
import { Page, Stat } from '../components/common';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { ShieldCheck } from 'lucide-react';
import './PaymentPasswordSetup.css';

export default function PaymentPasswordSetup() {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [step, setStep] = useState(1); // 1: set, 2: confirm
  const [firstPin, setFirstPin] = useState("");
  const [rsaPublicKey, setRsaPublicKey] = useState(null);
  const [loadingKey, setLoadingKey] = useState(true);
  const [keyError, setKeyError] = useState(false);
  const navigate = useNavigate();

  const fetchPublicKey = async () => {
    setLoadingKey(true);
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
    } finally {
      setLoadingKey(false);
    }
  };

  React.useEffect(() => {
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
        
        await api.post('/api/payments/password/setup', encryptedPayload);
        
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
    <Page title="결제 비밀번호 설정" desc="안전한 결제를 위해 6자리 비밀번호를 설정해주세요.">
      <div className="mypage-grid">
        <section className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShieldCheck size={48} color="#00c7ae" style={{ marginBottom: '16px' }} />
          <h2>결제 비밀번호 설정</h2>
          <p className="muted" style={{ marginBottom: '30px' }}>E2E 암호화를 통해 고객님의 비밀번호를 안전하게 보호합니다.</p>
          
          {loadingKey ? (
            <p style={{ color: '#666' }}>보안 연결(키 교환)을 설정하는 중입니다...</p>
          ) : keyError ? (
            <div>
              <p style={{ color: 'red', marginBottom: '12px' }}>보안 연결(키 교환)에 실패했습니다.</p>
              <button className="btn btn-outline" onClick={fetchPublicKey}>
                다시 시도
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '1.1rem' }}
              onClick={() => { setStep(1); setShowKeyboard(true); }}
            >
              비밀번호 {step === 1 ? '입력' : '재입력'} 하기
            </button>
          )}
        </section>
      </div>

      {showKeyboard && (
        <VirtualKeyboard 
          title={step === 1 ? "새 결제 비밀번호 6자리 입력" : "비밀번호 다시 한 번 입력"}
          onClose={() => setShowKeyboard(false)}
          onComplete={handlePinComplete}
        />
      )}
    </Page>
  );
}
