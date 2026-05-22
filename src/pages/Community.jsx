import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { api } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { Page, Input, FieldArea } from '../components/common';

const BOARDS = [
  { id: 'LIFE', name: '숨고생활' },
  { id: 'CENTER', name: '고수센터' },
];

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [activeBoard, setActiveBoard] = useState('LIFE');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', boardType: 'LIFE', files: [] });
  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const role = user?.role || user?.userRole || user?.authority || '';
  const isLogin = !!token;
  const isExpert = role === 'EXPERT' || role === 'ROLE_EXPERT';
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';

  const canViewCenter = isExpert || isAdmin;
  const canWriteCenter = isAdmin;

  const load = async () => {
    setMsg('');
    try {
      const res = await api.get('/api/community/posts');
      setPosts(normalizeList(res));
    } catch {
      setPosts([]);
      setMsg('게시글을 불러오지 못했어요.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeBoard = boardId => {
    setActiveBoard(boardId);
    setShowForm(false);
    setForm(prev => ({ ...prev, boardType: boardId }));
    setMsg('');
  };

  const openWriteForm = () => {
    if (activeBoard === 'LIFE' && !isLogin) {
      alert('로그인 후 글을 작성할 수 있어요.');
      return;
    }

    if (activeBoard === 'CENTER' && !canWriteCenter) {
      alert('고수센터 공지는 관리자만 등록할 수 있어요.');
      return;
    }

    setShowForm(true);
  };

  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files || []);

    setForm(prev => ({
      ...prev,
      files: selectedFiles
    }));
  };

  const submit = async e => {
    e.preventDefault();
    setMsg('');

    if (activeBoard === 'LIFE' && !isLogin) {
      alert('로그인 후 글을 작성할 수 있어요.');
      return;
    }

    if (activeBoard === 'CENTER' && !canWriteCenter) {
      alert('고수센터 공지는 관리자만 등록할 수 있어요.');
      return;
    }

    try {
      // 백엔드 구조상 파일을 먼저 업로드하고, 반환받은 fileId를 게시글 생성 요청에 함께 보냅니다.
      const imageFileIds = [];

      for (const file of form.files) {
        const fileData = new FormData();
        fileData.append('file', file);

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/files?domain=COMMUNITY_POST`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: fileData
          }
        );

        let uploadData = null;
        try {
          uploadData = await uploadRes.json();
        } catch {
          uploadData = null;
        }

        if (!uploadRes.ok || uploadData?.isSuccess === false) {
          throw new Error(uploadData?.message || `파일 업로드 실패: ${uploadRes.status}`);
        }

        const fileId =
          uploadData?.result?.fileId ||
          uploadData?.data?.result?.fileId ||
          uploadData?.data?.fileId ||
          uploadData?.fileId;

        if (fileId) imageFileIds.push(fileId);
      }

      await api.post('/api/community/posts', {
        title: form.title,
        content: form.content,
        categoryId: form.categoryId || null,
        boardType: activeBoard,
        imageFileIds
      });

      setForm({
        title: '',
        content: '',
        categoryId: '',
        boardType: activeBoard,
        files: []
      });

      setShowForm(false);
      await load();
    } catch (e) {
      console.error(e);
      setMsg('게시글 등록에 실패했어요.');
    }
  };

  const filteredPosts = posts.filter(p => {
    if (activeBoard === 'LIFE') return !p.boardType || p.boardType === 'LIFE';
    if (activeBoard === 'CENTER') return p.boardType === 'CENTER';
    return false;
  });
  const boardName = BOARDS.find(b => b.id === activeBoard)?.name || '게시판';

  const isCenterBlocked = activeBoard === 'CENTER' && !canViewCenter;

  return (
    <Page title="커뮤니티" desc="숨고생활과 고수센터 게시글을 확인하고 의견을 나눠보세요.">
      <div className="community-tabs">
        {BOARDS.map(board => (
          <button
            type="button"
            className={`tab-btn ${activeBoard === board.id ? 'active' : ''}`}
            onClick={() => changeBoard(board.id)}
            key={board.id}
          >
            {board.name}
          </button>
        ))}
      </div>

      <div className="card-row" style={{ marginBottom: 18 }}>
        <div />
        {activeBoard === 'LIFE' && (
          <button type="button" className="btn btn-primary" onClick={openWriteForm}>
            글쓰기 <Pencil size={17} />
          </button>
        )}

        {activeBoard === 'CENTER' && isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openWriteForm}>
            공지 등록 <Pencil size={17} />
          </button>
        )}
      </div>

      {msg && <p className="message">{msg}</p>}

      {isCenterBlocked ? (
        <div className="panel empty-panel">
          <p className="muted">고수 회원만 이용할 수 있는 공간이에요.</p>
        </div>
      ) : (
        <>
          {showForm && (
            <form className="panel form" onSubmit={submit} style={{ marginBottom: 22 }}>
              <h2>{activeBoard === 'CENTER' ? '고수센터 공지 등록' : '숨고생활 글쓰기'}</h2>
              <Input label="제목" value={form.title} onChange={v => setForm({ ...form, title: v })} />
              <FieldArea label="내용" value={form.content} onChange={v => setForm({ ...form, content: v })} />
              <label className="upload-box">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.hwp,.txt"
                  onChange={handleFileChange}
                  hidden
                />

                <div className="upload-icon">＋</div>

                <div>
                  <strong>파일 또는 이미지를 업로드하세요</strong>
                  <p>이미지, PDF, 문서 파일을 선택할 수 있어요.</p>
                </div>
              </label>

              {form.files.length > 0 && (
                <div className="upload-list">
                  {form.files.map((file, index) => (
                    <div className="upload-item" key={index}>
                      <span>📎 {file.name}</span>

                      <button
                        type="button"
                        onClick={() =>
                          setForm(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }))
                        }
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.files.length > 0 && (
                <div className="upload-preview">
                  {form.files.map((file, index) => (
                    <p key={index} className="muted">
                      {file.name}
                    </p>
                  ))}
                </div>
              )}
              <div className="action-row">
                <button type="submit" className="btn btn-primary">등록하기</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  취소
                </button>
              </div>
            </form>
          )}

          <div className="panel community-post-panel">
            <h2>{activeBoard === 'CENTER' ? '공지사항' : `${boardName} 게시글`}</h2>
            <div className="post-list community-scroll-list">
              {filteredPosts.length ? (
                filteredPosts.map(p => (
                  <Link
                    className="post-item post-link"
                    to={`/community/posts/${p.postId || p.id}`}
                    state={{ post: p }}
                    key={p.postId || p.id}
                  >
                    <span className="badge">{p.boardType === 'CENTER' ? '고수센터' : '숨고생활'}</span>
                    <h3>{p.title}</h3>
                    <p>{p.content || p.body || '내용을 확인해보세요.'}</p>
                    <small>{p.writerName || p.author || '익명'} · 조회 {p.viewCount ?? 0}</small>
                  </Link>
                ))
              ) : (
                <p className="muted">아직 작성된 글이 없어요.</p>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}