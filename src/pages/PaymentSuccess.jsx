import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function confirmPayment() {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setErrorMsg('결제 정보가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        // 메인 백엔드(Spring Boot)로 최종 승인 요청 전송
        await api.post('/api/payments/confirm', { 
          paymentKey, 
          orderId, 
          amount 
        });

        // api.js(client.js) 내부에서 에러(isSuccess=false) 발생 시 자동으로 catch 블록으로 넘어가므로
        // 여기까지 코드가 도달했다면 결제가 성공한 것입니다.
        alert('결제가 성공적으로 완료되었습니다.');
        navigate('/mypage'); // 마이페이지나 결제 완료 페이지로 이동
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || '메인 서버와 통신할 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    confirmPayment();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 50 }}>
        <h2>결제 승인 처리 중... ⏳</h2>
        <p>창을 닫지 마세요.</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 50 }}>
        <h2>결제 실패 ❌</h2>
        <p>{errorMsg}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return null;
}
