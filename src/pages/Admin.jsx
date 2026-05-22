import { MessageSquareText, ShieldCheck, UsersRound } from 'lucide-react';
import { Page, Stat } from '../components/common';

export default function Admin() {
  return <Page title="관리자" desc="회원 상태와 서비스 운영 정보를 관리합니다.">
    <div className="admin-grid"><Stat icon={<UsersRound />} value="128" label="전체 회원" /><Stat icon={<ShieldCheck />} value="12" label="활동 고수" /><Stat icon={<MessageSquareText />} value="24" label="요청 건수" /></div>
    <div className="panel table-wrap"><table><thead><tr><th>회원</th><th>권한</th><th>상태</th><th>관리</th></tr></thead><tbody><tr><td>user@example.com</td><td>USER</td><td>ACTIVE</td><td><button className="btn btn-ghost">정지</button></td></tr></tbody></table></div>
  </Page>;
}
