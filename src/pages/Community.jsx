import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, LockKeyhole, MessageCircle, Paperclip, Pencil, RefreshCw, Search } from 'lucide-react';
import { api, getStoredUser } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { Page, Input, FieldArea } from '../components/common';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const BOARD_CACHE_KEY = 'matchingon.community.boardCache';

const BOARDS = [
  { id: 'LIFE', name: '숨고생활', desc: '자유롭게 질문하고 경험을 공유하는 공간' },
  { id: 'CENTER', name: '고수센터', desc: '고수 회원과 관리자가 확인하는 공지/안내 공간' },
];

const SORT_OPTIONS = [
  { id: 'latest', name: '최신순', sort: 'communityPostId,desc' },
  { id: 'oldest', name: '오래된순', sort: 'communityPostId,asc' },
  { id: 'views', name: '조회수순', sort: 'viewCount,desc' },
  { id: 'title', name: '제목순', sort: 'title,asc' },
];

function getResult(data) {
  return data?.result ?? data?.data?.result ?? data?.data ?? data;
}


function getUploadedFileId(response) {
  const data = getResult(response);
  return data?.fileId ?? data?.id ?? data?.fileUploadId ?? data?.uploadFileId ?? null;
}

function getUploadedStoredName(response) {
  const data = getResult(response);
  if (data?.storedName) return data.storedName;
  const url = data?.fileUrl || data?.url || '';
  const cleanUrl = url.split('?')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop();
  return lastPart || null;
}

async function uploadFileToServer(file) {
  if (typeof api.uploadFile === 'function') {
    return api.uploadFile('COMMUNITY_POST', file);
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  const token = localStorage.getItem('accessToken');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/files?domain=COMMUNITY_POST`, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok || data?.isSuccess === false) {
    throw new Error(data?.message || `파일 업로드 실패: ${res.status}`);
  }

  return data || { result: null };
}

async function cleanupUploadedFiles(uploadedFiles) {
  await Promise.all((uploadedFiles || []).map(async uploaded => {
    const storedName = getUploadedStoredName(uploaded);
    if (!storedName) return;

    try {
      await api.delete(`/api/files/${encodeURIComponent(storedName)}`);
    } catch {
      // 글 등록 실패 시 업로드된 임시 파일 삭제를 시도하되, 삭제 실패가 화면 흐름을 막지는 않게 둡니다.
    }
  }));
}

async function uploadCommunityFiles(files) {
  const uploadedFiles = [];
  const imageFileIds = [];

  for (const file of files || []) {
    const uploaded = await uploadFileToServer(file);
    uploadedFiles.push(uploaded);

    const fileId = getUploadedFileId(uploaded);
    if (!fileId) {
      await cleanupUploadedFiles(uploadedFiles);
      throw new Error('파일 업로드는 됐지만 응답에 fileId가 없어 게시글과 연결할 수 없어요. 백엔드 응답에 fileId가 내려오는지 확인해주세요.');
    }

    imageFileIds.push(Number(fileId));
  }

  return { imageFileIds, uploadedFiles };
}

function getPostId(post) {
  return post?.postId ?? post?.id ?? post?.communityPostId;
}

function readBoardCache() {
  try {
    return JSON.parse(localStorage.getItem(BOARD_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeBoardCache(cache) {
  localStorage.setItem(BOARD_CACHE_KEY, JSON.stringify(cache));
}

function rememberBoard(postId, boardType) {
  if (!postId || !boardType) return;
  const cache = readBoardCache();
  cache[String(postId)] = boardType;
  writeBoardCache(cache);
}

function applyCachedBoard(post, cache) {
  const postId = getPostId(post);
  const cachedBoard = postId ? cache[String(postId)] : null;

  return {
    ...post,
    _boardType: post?.boardType || cachedBoard || null,
  };
}

function getRole(user) {
  return user?.role || user?.userRole || user?.authority || user?.userType || '';
}

function getFileUrls(post) {
  if (Array.isArray(post?.imageUrls)) return post.imageUrls;
  if (Array.isArray(post?.fileUrls)) return post.fileUrls;
  if (Array.isArray(post?.files)) {
    return post.files.map(file => file?.fileUrl || file?.url).filter(Boolean);
  }
  return [];
}


async function fetchCommentCount(postId) {
  if (!postId) return 0;

  try {
    const res = await api.get(`/api/community/posts/${postId}/comments`);
    return normalizeList(res).length;
  } catch {
    // 댓글 API가 일시적으로 실패해도 게시글 목록 자체는 보여줍니다.
    return 0;
  }
}

async function attachCommentCounts(posts) {
  return Promise.all((posts || []).map(async post => {
    const currentCount = post?.commentCount ?? post?.commentsCount ?? post?.replyCount;
    if (currentCount !== undefined && currentCount !== null) {
      return { ...post, commentCount: Number(currentCount) || 0 };
    }

    const postId = getPostId(post);
    const commentCount = await fetchCommentCount(postId);
    return { ...post, commentCount };
  }));
}

function getFileHref(url) {
  if (!url) return '#';
  const normalizedUrl = url.replace('/api/files/download/', '/api/files/');
  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) return normalizedUrl;
  return `${API_BASE_URL}${normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`}`;
}

function getFileNameFromUrl(url, index) {
  if (!url) return `첨부파일 ${index + 1}`;
  const cleanUrl = url.split('?')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop();
  const decodedName = decodeURIComponent(lastPart || `첨부파일 ${index + 1}`);

  // 백엔드는 저장 파일명을 UUID_원본파일명 형태로 내려주므로 화면에는 원본 파일명만 표시합니다.
  return decodedName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
}

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((url || '').split('?')[0]);
}

function clipText(text, max = 120) {
  const value = (text || '').trim();
  if (!value) return '내용을 확인해보세요.';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [activeBoard, setActiveBoard] = useState('LIFE');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', files: [] });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const fileBoxRef = useRef(null);

  const token = localStorage.getItem('accessToken');
  const user = getStoredUser();
  const role = getRole(user);

  const isLogin = !!token;
  const isExpert = role === 'EXPERT' || role === 'ROLE_EXPERT';
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const canViewCenter = isExpert || isAdmin;
  const canWriteCenter = isAdmin;

  const boardCache = useMemo(() => readBoardCache(), [posts.length]);

  const load = async () => {
    setLoading(true);
    setMsg('');

    try {
      const selectedSort = SORT_OPTIONS.find(option => option.id === sortOption) || SORT_OPTIONS[0];
      const params = new URLSearchParams({ size: '100' });

      if (selectedSort.sort) {
        params.set('sort', selectedSort.sort);
      }

      const res = await api.get(`/api/community/posts?${params.toString()}`);
      const rawList = normalizeList(res).map(post => applyCachedBoard(post, readBoardCache()));
      const list = await attachCommentCounts(rawList);
      setPosts(list);
    } catch (err) {
      setPosts([]);
      setMsg(err.message || '게시글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sortOption]);

  const activeBoardInfo = BOARDS.find(board => board.id === activeBoard) || BOARDS[0];
  const isCenterBlocked = activeBoard === 'CENTER' && !canViewCenter;

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter(post => {
      const boardType = post._boardType;
      const title = (post.title || '').toLowerCase();
      const content = (post.content || post.body || '').toLowerCase();
      const writer = (post.writerName || post.author || '').toLowerCase();
      const matchedKeyword = !keyword || title.includes(keyword) || content.includes(keyword) || writer.includes(keyword);

      if (!matchedKeyword) return false;

      if (activeBoard === 'CENTER') return boardType === 'CENTER';

      // 현재 백엔드 목록 응답에는 boardType이 없기 때문에 기존 글은 LIFE 쪽에서 보이도록 둡니다.
      return boardType !== 'CENTER';
    });
  }, [posts, search, activeBoard]);

  const resetForm = () => {
    setForm({ title: '', content: '', categoryId: '', files: [] });
    setErrors({});
    setShowForm(false);
    setMsg('');
  };

  const changeBoard = boardId => {
    setActiveBoard(boardId);
    resetForm(boardId);
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
    setMsg('');
  };

  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files || []);
    setForm(prev => ({ ...prev, files: selectedFiles }));
    e.target.value = '';
  };

  const removeFile = index => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = '제목을 입력해주세요.';
    if (!form.content.trim()) nextErrors.content = '내용을 입력해주세요.';
    setErrors(nextErrors);

    if (nextErrors.title) titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (nextErrors.content) contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (nextErrors.files) fileBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return Object.keys(nextErrors).length === 0;
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

    if (!validate()) return;

    let uploadedFiles = [];

    try {
      const uploadResult = await uploadCommunityFiles(form.files);
      uploadedFiles = uploadResult.uploadedFiles;

      const res = await api.post('/api/community/posts', {
        title: form.title.trim(),
        content: form.content.trim(),
        categoryId: form.categoryId || null,
        locationId: null,
        boardType: activeBoard,
        imageFileIds: uploadResult.imageFileIds,
      });

      const savedPost = getResult(res);
      rememberBoard(getPostId(savedPost), activeBoard);

      setForm({ title: '', content: '', categoryId: '', files: [] });
      setShowForm(false);
      setMsg('게시글이 등록됐어요.');
      await load();
    } catch (err) {
      if (uploadedFiles.length > 0) await cleanupUploadedFiles(uploadedFiles);
      setMsg(err.message || '게시글 등록에 실패했어요.');
    }
  };

  return (
    <Page title="커뮤니티" desc="숨고생활과 고수센터 게시글을 확인하고 의견을 나눠보세요.">
      <div className="community-shell">
        <div className="community-tabs community-tabs-final">
          {BOARDS.map(board => (
            <button
              type="button"
              className={`tab-btn ${activeBoard === board.id ? 'active' : ''}`}
              onClick={() => changeBoard(board.id)}
              key={board.id}
            >
              <strong>{board.name}</strong>
              <span>{board.desc}</span>
            </button>
          ))}
        </div>

        <div className="community-toolbar panel">
          <div className="community-toolbar-copy">
            <span className="badge">{activeBoardInfo.name}</span>
            <h2>{activeBoard === 'CENTER' ? '고수센터 공지' : '숨고생활 게시글'}</h2>
            <p>{activeBoardInfo.desc}</p>
          </div>

          <div className="community-toolbar-actions">
            <label className="community-search">
              <Search size={18} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="제목, 내용, 작성자 검색"
              />
            </label>

            <label className="community-sort">
              <span>정렬</span>
              <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
                {SORT_OPTIONS.map(option => (
                  <option value={option.id} key={option.id}>{option.name}</option>
                ))}
              </select>
            </label>

            <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={17} />
              새로고침
            </button>

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
        </div>

        {msg && <p className="message">{msg}</p>}

        {isCenterBlocked ? (
          <div className="panel empty-panel community-empty-card">
            <LockKeyhole size={34} />
            <h3>고수 회원 전용 공간이에요.</h3>
            <p className="muted">고수센터는 고수 회원 또는 관리자만 확인할 수 있어요.</p>
          </div>
        ) : (
          <>
            {showForm && (
              <form className="panel form community-write-form" onSubmit={submit}>
                <div className="form-title-row">
                  <div>
                    <span className="badge">{activeBoardInfo.name}</span>
                    <h2>{activeBoard === 'CENTER' ? '고수센터 공지 등록' : '숨고생활 글쓰기'}</h2>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => resetForm()}>
                    닫기
                  </button>
                </div>

                <Input
                  label="제목"
                  value={form.title}
                  onChange={v => setForm({ ...form, title: v })}
                  placeholder="게시글 제목을 입력해주세요."
                  error={errors.title}
                  inputRef={titleRef}
                />

                <FieldArea
                  label="내용"
                  value={form.content}
                  onChange={v => setForm({ ...form, content: v })}
                  placeholder="궁금한 점이나 공유하고 싶은 내용을 입력해주세요."
                  error={errors.content}
                  textareaRef={contentRef}
                />

                <div ref={fileBoxRef} className={errors.files ? 'field-error' : ''}>
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
                      <strong>첨부파일 선택</strong>
                      <p>등록하기를 누르면 파일 업로드 API를 먼저 호출한 뒤 게시글에 연결해요.</p>
                    </div>
                  </label>
                  {errors.files && <small className="field-error-text">{errors.files}</small>}
                </div>

                {form.files.length > 0 && (
                  <div className="upload-list">
                    {form.files.map((file, index) => (
                      <div className="upload-item" key={`${file.name}-${index}`}>
                        <span>📎 {file.name}</span>
                        <button type="button" onClick={() => removeFile(index)}>삭제</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="action-row">
                  <button type="submit" className="btn btn-primary">등록하기</button>
                  <button type="button" className="btn btn-ghost" onClick={() => resetForm()}>
                    취소
                  </button>
                </div>
              </form>
            )}

            <div className="community-post-summary">
              <b>{filteredPosts.length}</b>
              <span>개의 게시글</span>
              {loading && <small>불러오는 중...</small>}
            </div>

            <div className="community-post-grid">
              {filteredPosts.length ? (
                filteredPosts.map(post => {
                  const postId = getPostId(post);
                  const files = getFileUrls(post);
                  const boardType = post._boardType;

                  return (
                    <Link
                      className="community-post-card panel"
                      to={`/community/posts/${postId}`}
                      state={{ post: { ...post, boardType } }}
                      key={postId}
                    >
                      <div className="community-post-card-head">
                        <span className="badge">{boardType === 'CENTER' ? '고수센터' : '숨고생활'}</span>
                        {files.length > 0 && <span className="file-count"><Paperclip size={14} /> {files.length}</span>}
                      </div>

                      <h3>{post.title || '제목 없음'}</h3>
                      <p>{clipText(post.content || post.body)}</p>

                      <div className="community-post-meta">
                        <span>{post.writerName || post.author || '익명'}</span>
                        <span><Eye size={14} /> {post.viewCount ?? 0}</span>
                        <span><MessageCircle size={14} /> {post.commentCount ?? 0}</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="panel community-empty-card">
                  <MessageCircle size={34} />
                  <h3>{search ? '검색 결과가 없어요.' : '아직 작성된 글이 없어요.'}</h3>
                  <p className="muted">
                    {search ? '검색어를 바꾸거나 새로고침을 눌러보세요.' : '첫 게시글을 작성해 커뮤니티를 시작해보세요.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
