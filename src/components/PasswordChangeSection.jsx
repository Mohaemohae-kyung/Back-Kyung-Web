import React, { useState } from 'react';
import { api } from '../api/client';
import { Input } from './common';

export default function PasswordChangeSection() {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [msg, setMsg] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        setSuccess(false);

        // 프론트엔드 1차 검증: 새 비밀번호와 확인 입력값 대조
        if (form.newPassword !== form.confirmPassword) {
            setMsg('새로 입력한 비밀번호가 서로 일치하지 않습니다.');
            return;
        }

        try {
            // 백엔드 패스워드 변경 API 호출
            await api.post('/api/auth/password/change', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            setSuccess(true);
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMsg(err.message || '비밀번호 변경에 실패했습니다.');
        }
    };

    return (
        <div className="panel profile-section" style={{ marginTop: '30px' }}>
            <h3>비밀번호 변경</h3>
            
            {msg && <p className="message" style={{ color: '#E06C75', marginBottom: '15px' }}>{msg}</p>}
            {success && <p className="message" style={{ color: '#4A90E2', marginBottom: '15px' }}>비밀번호가 성공적으로 변경되었습니다.</p>}

            <form className="form" onSubmit={handleSubmit}>
                <Input
                    label="현재 비밀번호"
                    type="password"
                    value={form.currentPassword}
                    onChange={(v) => setForm({ ...form, currentPassword: v })}
                    placeholder="현재 비밀번호를 입력하세요."
                />
                
                <Input
                    label="새 비밀번호"
                    type="password"
                    value={form.newPassword}
                    onChange={(v) => setForm({ ...form, newPassword: v })}
                    placeholder="새 비밀번호를 입력하세요 (8자~20자)."
                />
                
                <Input
                    label="새 비밀번호 확인"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(v) => setForm({ ...form, confirmPassword: v })}
                    placeholder="새 비밀번호를 다시 한번 입력하세요."
                />

                <button className="btn btn-primary" style={{ marginTop: '15px' }}>
                    비밀번호 변경하기
                </button>
            </form>
        </div>
    );
}