import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, MessageCircle, Paperclip, Send, Trash2 } from 'lucide-react';
import { api, getStoredUser } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { Page, Input, FieldArea } from '../components/common';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const BOARD_CACHE_KEY = 'matchingon.community.boardCache';

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
      await api.delete(`/api/files?fileKey=${encodeURIComponent(storedName)}`);
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

function rememberBoard(postId, boardType) {
  if (!postId || !boardType) return;
  const cache = readBoardCache();
  cache[String(postId)] = boardType;
  localStorage.setItem(BOARD_CACHE_KEY, JSON.stringify(cache));
}

function getCachedBoard(postId) {
  return readBoardCache()[String(postId)] || null;
}

function getRole(user) {
  return user?.role || user?.userRole || user?.authority || user?.userType || '';
}

function isMine(writerName) {
  const user = getStoredUser();
  const candidates = [user?.name, user?.nickname, user?.displayName].filter(Boolean);
  return !!writerName && candidates.includes(writerName);
}

function getFileUrls(post) {
  if (Array.isArray(post?.files) && post.files.length > 0) {
    return post.files;
  }

  if (Array.isArray(post?.imageUrls)) return post.imageUrls;
  if (Array.isArray(post?.fileUrls)) return post.fileUrls;

  return [];
}

function getFileUrl(file) {
  if (!file) return '';

  if (typeof file === 'object') {
    return file.fileUrl || file.url || file.filePath || '';
  }

  return file;
}

function getFileKeyFromUrl(file) {
  if (!file) return null;

  if (typeof file === 'object') {
    return (
      file.storedName ||
      file.fileKey ||
      file.storedFileName ||
      getFileKeyFromUrl(file.fileUrl || file.url || file.filePath)
    );
  }

  const value = String(file).trim();

  try {
    const parsedUrl = new URL(value);

    const queryFileKey = parsedUrl.searchParams.get('fileKey');
    if (queryFileKey) {
      return decodeURIComponent(queryFileKey);
    }

    const path = parsedUrl.pathname.replace(/^\/+/, '');

    if (path.startsWith('api/files/download/')) {
      return decodeURIComponent(path.replace('api/files/download/', ''));
    }

    if (path.startsWith('uploads/')) {
      return decodeURIComponent(path);
    }

    return decodeURIComponent(path);
  } catch {
    const cleanUrl = value.split('?')[0];
    const path = cleanUrl.replace(/^\/+/, '');

    if (path.startsWith('api/files/download/')) {
      return decodeURIComponent(path.replace('api/files/download/', ''));
    }

    return decodeURIComponent(path);
  }
}

function getFileHref(url) {
  const fileKey = getFileKeyFromUrl(url);

  if (!fileKey) return '#';

  return `${API_BASE_URL}/api/files/download?fileKey=${encodeURIComponent(fileKey)}`;
}

function getStoredNameFromUrl(url) {
  return getFileKeyFromUrl(url);
}

async function downloadFileWithAuth(url, index) {
  const href = getFileHref(url);
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(href, { headers });
  if (!res.ok) {
    throw new Error(`파일 다운로드 실패: ${res.status}`);
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = getFileNameFromUrl(url, index);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function getFileNameFromUrl(file, index) {
  if (!file) return `첨부파일 ${index + 1}`;

  if (typeof file === 'object') {
    return (
      file.originalName ||
      file.originalFileName ||
      file.fileName ||
      file.name ||
      getFileNameFromUrl(file.fileUrl || file.url || file.filePath, index)
    );
  }

  const cleanUrl = String(file).split('?')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop();
  const decodedName = decodeURIComponent(lastPart || '');

  if (!decodedName) {
    return `첨부파일 ${index + 1}`;
  }

  return decodedName.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i,
    ''
  );
}

function isImageUrl(file) {
  const url = getFileUrl(file);
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((url || '').split('?')[0]);
}

export default function CommunityPostDetail() {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialPost = location.state?.post || null;
  const initialBoardType = initialPost?.boardType || getCachedBoard(postId) || 'LIFE';

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', boardType: initialBoardType });
  const [newFiles, setNewFiles] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingFileUrl, setDeletingFileUrl] = useState(null);

  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const fileBoxRef = useRef(null);

  const user = getStoredUser();
  const role = getRole(user);
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const boardType = post?.boardType || getCachedBoard(postId) || postForm.boardType || 'LIFE';
  const writerName = post?.writerName || post?.author;
  const mine = isMine(writerName) || isAdmin;
  const imageUrls = useMemo(() => getFileUrls(post), [post]);

  const load = async () => {
    setLoading(true);
    setMsg('');

    try {
      const postRes = await api.get(`/api/community/posts/${postId}`);
      const data = getResult(postRes);
      const nextBoardType = data?.boardType || getCachedBoard(postId) || boardType || 'LIFE';
      const nextPost = data ? { ...data, boardType: nextBoardType } : null;

      setPost(nextPost);
      setPostForm({
        title: nextPost?.title || '',
        content: nextPost?.content || nextPost?.body || '',
        boardType: nextBoardType,
      });
    } catch (err) {
      setMsg(err.message || '게시글을 불러오지 못했어요.');
    }

    try {
      const commentRes = await api.get(`/api/community/posts/${postId}/comments`);
      setComments(normalizeList(commentRes));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const validatePost = () => {
    const nextErrors = {};

    if (!postForm.title.trim()) nextErrors.title = '제목을 입력해주세요.';
    if (!postForm.content.trim()) nextErrors.content = '내용을 입력해주세요.';
    setErrors(nextErrors);

    if (nextErrors.title) titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (nextErrors.content) contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (nextErrors.files) fileBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return Object.keys(nextErrors).length === 0;
  };

  const submitComment = async e => {
    e.preventDefault();
    setMsg('');

    if (!localStorage.getItem('accessToken')) {
      alert('로그인 후 댓글을 작성할 수 있어요.');
      return;
    }

    if (!comment.trim()) return;

    try {
      await api.post(`/api/community/posts/${postId}/comments`, { content: comment.trim() });
      setComment('');
      await load();
    } catch (err) {
      setMsg(err.message || '댓글 등록에 실패했어요.');
    }
  };

  const handleNewFileChange = e => {
    const selectedFiles = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = '';
  };

  const updatePost = async e => {
    e.preventDefault();
    setMsg('');

    if (!validatePost()) return;

    let uploadedFiles = [];

    try {
      const uploadResult = await uploadCommunityFiles(newFiles);
      uploadedFiles = uploadResult.uploadedFiles;

      const res = await api.patch(`/api/community/posts/${postId}`, {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        boardType: postForm.boardType || boardType || 'LIFE',
        imageFileIds: uploadResult.imageFileIds,
      });

      const updated = getResult(res);
      rememberBoard(getPostId(updated) || postId, postForm.boardType || boardType || 'LIFE');

      setNewFiles([]);
      setEditingPost(false);
      setMsg('게시글이 수정됐어요.');
      await load();
    } catch (err) {
      if (uploadedFiles.length > 0) await cleanupUploadedFiles(uploadedFiles);
      setMsg(err.message || '게시글 수정에 실패했어요.');
    }
  };

  const deleteExistingFile = async file => {
    const storedName = getStoredNameFromUrl(file);

    if (!storedName) {
      setMsg('삭제할 파일 정보를 찾지 못했어요.');
      return;
    }

    if (!confirm(`${getFileNameFromUrl(file, 0)} 파일을 삭제할까요?`)) return;

    setDeletingFileUrl(storedName);
    setMsg('');

    try {
      await api.delete(`/api/files?fileKey=${encodeURIComponent(storedName)}`);

      setPost(prev => {
        if (!prev) return prev;

        const nextFiles = getFileUrls(prev).filter(
          existingFile => getFileKeyFromUrl(existingFile) !== storedName
        );

        return {
          ...prev,
          files: nextFiles,
          imageUrls: nextFiles.map(getFileUrl).filter(Boolean),
          fileUrls: nextFiles.map(getFileUrl).filter(Boolean),
        };
      });

      setMsg('첨부파일이 삭제됐어요.');
      await load();
    } catch (err) {
      setMsg(err.message || '첨부파일 삭제에 실패했어요. 다시 로그인 후 시도해주세요.');
    } finally {
      setDeletingFileUrl(null);
    }
  };

  const deletePost = async () => {
    if (!confirm('게시글을 삭제할까요?')) return;

    try {
      await api.delete(`/api/community/posts/${postId}`);
      navigate('/community');
    } catch (err) {
      setMsg(err.message || '게시글 삭제에 실패했어요.');
    }
  };

  const startEditPost = () => {
    setNewFiles([]);
    setErrors({});
    setPostForm({
      title: post?.title || '',
      content: post?.content || post?.body || '',
      boardType,
    });
    setEditingPost(true);
    setMsg('');
  };

  const cancelEditPost = () => {
    setNewFiles([]);
    setErrors({});
    setEditingPost(false);
    setMsg('');
  };

  const startEditComment = c => {
    setEditingCommentId(c.commentId || c.id);
    setEditingCommentContent(c.content || c.body || '');
    setMsg('');
  };

  const updateComment = async commentId => {
    if (!editingCommentContent.trim()) return;

    try {
      await api.patch(`/api/community/comments/${commentId}`, { content: editingCommentContent.trim() });
      setEditingCommentId(null);
      setEditingCommentContent('');
      await load();
    } catch (err) {
      setMsg(err.message || '댓글 수정에 실패했어요.');
    }
  };

  const deleteComment = async commentId => {
    if (!confirm('댓글을 삭제할까요?')) return;

    try {
      await api.delete(`/api/community/comments/${commentId}`);
      await load();
    } catch (err) {
      setMsg(err.message || '댓글 삭제에 실패했어요.');
    }
  };

  return (
    <Page
      title="게시글 상세"
      desc="게시글 내용과 댓글을 확인합니다."
      action={
        <button className="btn btn-ghost" onClick={() => navigate('/community')}>
          <ArrowLeft size={17} /> 목록으로
        </button>
      }
    >
      {msg && <p className="message">{msg}</p>}

      <div className="post-detail-layout post-detail-layout-final">
        <article className="panel post-detail-card post-detail-card-final">
          <div className="post-detail-meta">
            <span className="badge">{boardType === 'CENTER' ? '고수센터' : '숨고생활'}</span>
            <small>
              {writerName || '익명'} · <Eye size={13} /> {post?.viewCount ?? 0}
              {loading ? ' · 불러오는 중...' : ''}
            </small>
          </div>

          {editingPost ? (
            <form className="form" onSubmit={updatePost}>
              <Input
                label="제목"
                value={postForm.title}
                onChange={v => setPostForm({ ...postForm, title: v })}
                error={errors.title}
                inputRef={titleRef}
              />
              <FieldArea
                label="내용"
                value={postForm.content}
                onChange={v => setPostForm({ ...postForm, content: v })}
                error={errors.content}
                textareaRef={contentRef}
              />

              {imageUrls.length > 0 && (
                <div className="attached-file-box">
                  <h3><Paperclip size={17} /> 기존 첨부파일</h3>
                  <AttachedFiles
                    files={imageUrls}
                    canDelete
                    deletingFileUrl={deletingFileUrl}
                    onDelete={deleteExistingFile}
                  />
                  <p className="muted" style={{ marginTop: 8 }}>
                    삭제하면 해당 파일이 서버에서도 삭제됩니다.
                  </p>
                </div>
              )}

              <div ref={fileBoxRef} className={errors.files ? 'field-error' : ''}>
                <label className="upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.hwp,.txt"
                    onChange={handleNewFileChange}
                    hidden
                  />

                  <div className="upload-icon">＋</div>

                  <div>
                    <strong>새 첨부파일 선택</strong>
                    <p>수정 완료를 누르면 파일 업로드 API를 먼저 호출한 뒤 게시글에 연결해요.</p>
                  </div>
                </label>
                {errors.files && <small className="field-error-text">{errors.files}</small>}
              </div>

              {newFiles.length > 0 && (
                <div className="upload-list">
                  {newFiles.map((file, index) => (
                    <div className="upload-item" key={`${file.name}-${index}`}>
                      <span>📎 {file.name}</span>
                      <button type="button" onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== index))}>
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="action-row">
                <button className="btn btn-primary">수정 완료</button>
                <button type="button" className="btn btn-ghost" onClick={cancelEditPost}>취소</button>
              </div>
            </form>
          ) : (
            <>
              <h2>{post?.title || '게시글을 불러오는 중입니다.'}</h2>
              <div className="post-content-body">
                {post?.content || post?.body || '게시글 내용이 없습니다.'}
              </div>

              {imageUrls.length > 0 && (
                <div className="attached-file-box">
                  <h3><Paperclip size={17} /> 첨부파일</h3>
                  <AttachedFiles files={imageUrls} />
                </div>
              )}

              {mine && (
                <div className="action-row">
                  <button className="btn btn-ghost" onClick={startEditPost}>수정</button>
                  <button className="btn btn-ghost danger" onClick={deletePost}><Trash2 size={16} /> 삭제</button>
                </div>
              )}
            </>
          )}
        </article>

        <section className="panel comment-panel comment-panel-final">
          <div className="comment-title-row">
            <h2><MessageCircle size={20} /> 댓글</h2>
            <span>{comments.length}</span>
          </div>

          <div className="comment-list">
            {comments.length ? comments.map(c => {
              const commentId = c.commentId || c.id;
              const commentWriter = c.writerName || c.author;
              const commentMine = isMine(commentWriter) || isAdmin;

              return (
                <div className="comment-item" key={commentId}>
                  <div className="comment-head">
                    <b>{commentWriter || '익명'}</b>
                    {commentMine && (
                      <div className="mini-actions">
                        <button type="button" onClick={() => startEditComment(c)}>수정</button>
                        <button type="button" onClick={() => deleteComment(commentId)}>삭제</button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === commentId ? (
                    <div className="comment-edit">
                      <input
                        value={editingCommentContent}
                        onChange={e => setEditingCommentContent(e.target.value)}
                        placeholder="댓글을 수정하세요"
                      />
                      <button className="btn btn-primary" type="button" onClick={() => updateComment(commentId)}>저장</button>
                      <button className="btn btn-ghost" type="button" onClick={() => setEditingCommentId(null)}>취소</button>
                    </div>
                  ) : (
                    <p>{c.content || c.body}</p>
                  )}
                </div>
              );
            }) : (
              <div className="comment-empty">
                <MessageCircle size={28} />
                <p className="muted">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
              </div>
            )}
          </div>

          <form className="comment-form" onSubmit={submitComment}>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글을 입력하세요" />
            <button className="btn btn-primary"><Send size={16} /> 등록</button>
          </form>
        </section>
      </div>
    </Page>
  );
}

function AttachedFiles({ files, canDelete = false, deletingFileUrl = null, onDelete }) {
  const handleDownload = async (file, index) => {
    try {
      await downloadFileWithAuth(file, index);
    } catch (err) {
      alert(err.message || '파일을 다운로드하지 못했어요. 다시 로그인 후 시도해주세요.');
    }
  };

  return (
    <div className="attached-file-list">
      {files.map((file, index) => {
        const fileKey = getFileKeyFromUrl(file);
        const fileName = getFileNameFromUrl(file, index);

        return (
          <div
            className="attached-file-link"
            key={`${fileKey || getFileUrl(file) || index}-${index}`}
            title={fileName}
          >
            <span className="attached-file-name">📎 {fileName}</span>

            <div className="attached-file-actions">
              <button
                type="button"
                className="attached-file-action"
                onClick={() => handleDownload(file, index)}
              >
                다운로드
              </button>

              {canDelete && (
                <button
                  type="button"
                  className="attached-file-action danger"
                  onClick={() => onDelete?.(file)}
                  disabled={deletingFileUrl === fileKey}
                >
                  {deletingFileUrl === fileKey ? '삭제 중' : '삭제'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
