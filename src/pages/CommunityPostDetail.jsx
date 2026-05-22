import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getStoredUser } from '../api/client';
import { normalizeList } from '../utils/normalizeList';
import { Page, Input, FieldArea } from '../components/common';

const API_BASE_URL = 'http://localhost:8080';

function isMine(writerName) {
  const user = getStoredUser();
  return !!writerName && (writerName === user?.name || writerName === user?.nickname);
}

function getFileNameFromUrl(url, index) {
  if (!url) return `첨부파일 ${index + 1}`;

  const cleanUrl = url.split('?')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop();

  return lastPart || `첨부파일 ${index + 1}`;
}

function getFileHref(url) {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function getResult(data) {
  return data?.result ?? data?.data?.result ?? data?.data ?? data;
}

export default function CommunityPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = window.history.state?.usr || {};
  const [post, setPost] = useState(location.post || null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', boardType: 'LIFE' });
  const [newFiles, setNewFiles] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setMsg('');

    try {
      const postRes = await api.get(`/api/community/posts/${postId}`);
      const data = getResult(postRes);

      if (data) {
        setPost(data);
        setPostForm({
          title: data.title || '',
          content: data.content || data.body || '',
          boardType: data.boardType || postForm.boardType || 'LIFE'
        });
      }
    } catch (err) {
      setMsg(err.message || '게시글을 불러오지 못했어요.');
    }

    try {
      const commentRes = await api.get(`/api/community/posts/${postId}/comments`);
      setComments(normalizeList(commentRes));
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const submitComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await api.post(`/api/community/posts/${postId}/comments`, { content: comment });
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

    try {
      const imageFileIds = [];

      for (const file of newFiles) {
        const uploadData = await api.uploadFile('COMMUNITY_POST', file);
        const uploadResult = getResult(uploadData);
        const fileId = uploadResult?.fileId;

        if (!fileId) {
          throw new Error('파일 업로드 응답에서 fileId를 찾지 못했어요.');
        }

        imageFileIds.push(fileId);
      }

      await api.patch(`/api/community/posts/${postId}`, {
        ...postForm,
        imageFileIds
      });

      setNewFiles([]);
      setEditingPost(false);
      await load();
    } catch (err) {
      console.error(err);
      setMsg(err.message || '게시글 수정에 실패했어요.');
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
    setPostForm({
      title: post?.title || '',
      content: post?.content || post?.body || '',
      boardType: post?.boardType || postForm.boardType || 'LIFE'
    });
    setEditingPost(true);
    setMsg('');
  };

  const cancelEditPost = () => {
    setNewFiles([]);
    setEditingPost(false);
    setMsg('');
  };

  const startEditComment = c => {
    setEditingCommentId(c.commentId || c.id);
    setEditingCommentContent(c.content || c.body || '');
  };

  const updateComment = async commentId => {
    try {
      await api.patch(`/api/community/comments/${commentId}`, { content: editingCommentContent });
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

  const writerName = post?.writerName || post?.author;
  const mine = isMine(writerName);
  const imageUrls = Array.isArray(post?.imageUrls) ? post.imageUrls : [];

  return (
    <Page
      title="게시글 상세"
      desc="게시글 내용과 댓글을 확인합니다."
      action={
        <button className="btn btn-ghost" onClick={() => navigate('/community')}>
          목록으로
        </button>
      }
    >
      {msg && <p className="message">{msg}</p>}

      <div className="post-detail-layout">
        <article className="panel post-detail-card">
          <div className="post-detail-meta">
            <span className="badge">{post?.boardType === 'CENTER' ? '공지사항' : '숨고생활'}</span>
            <small>{writerName || '익명'} · 조회 {post?.viewCount ?? 0}</small>
          </div>

          {editingPost ? (
            <form className="form" onSubmit={updatePost}>
              <Input label="제목" value={postForm.title} onChange={v => setPostForm({ ...postForm, title: v })} />
              <FieldArea label="내용" value={postForm.content} onChange={v => setPostForm({ ...postForm, content: v })} />

              {imageUrls.length > 0 && (
                <div className="attached-file-box">
                  <h3>기존 첨부파일</h3>
                  <div className="attached-file-list">
                    {imageUrls.map((url, index) => (
                      <a
                        className="attached-file-link"
                        key={`${url}-${index}`}
                        href={getFileHref(url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📎 {getFileNameFromUrl(url, index)}
                      </a>
                    ))}
                  </div>
                  <p className="muted" style={{ marginTop: 8 }}>
                    기존 첨부파일은 유지되고, 아래에서 선택한 파일은 추가로 첨부됩니다.
                  </p>
                </div>
              )}

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
                  <strong>새 파일 또는 이미지를 추가하세요</strong>
                  <p>이미지, PDF, 문서 파일을 추가로 선택할 수 있어요.</p>
                </div>
              </label>

              {newFiles.length > 0 && (
                <div className="upload-list">
                  {newFiles.map((file, index) => (
                    <div className="upload-item" key={`${file.name}-${index}`}>
                      <span>📎 {file.name}</span>

                      <button
                        type="button"
                        onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="action-row">
                <button className="btn btn-primary">수정 완료</button>
                <button type="button" className="btn btn-ghost" onClick={cancelEditPost}>
                  취소
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{post?.title || '게시글을 불러오는 중입니다.'}</h2>
              <p>{post?.content || post?.body || '게시글 내용이 없습니다.'}</p>

              {imageUrls.length > 0 && (
                <div className="attached-file-box">
                  <h3>첨부파일</h3>
                  <div className="attached-file-list">
                    {imageUrls.map((url, index) => (
                      <a
                        className="attached-file-link"
                        key={`${url}-${index}`}
                        href={getFileHref(url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📎 {getFileNameFromUrl(url, index)}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {mine && (
                <div className="action-row">
                  <button className="btn btn-ghost" onClick={startEditPost}>수정</button>
                  <button className="btn btn-ghost danger" onClick={deletePost}>삭제</button>
                </div>
              )}
            </>
          )}
        </article>

        <section className="panel comment-panel">
          <h2>댓글</h2>

          <div className="comment-list">
            {comments.length ? comments.map(c => {
              const commentId = c.commentId || c.id;
              const commentWriter = c.writerName || c.author;
              const commentMine = isMine(commentWriter);

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
                      <input value={editingCommentContent} onChange={e => setEditingCommentContent(e.target.value)} />
                      <button className="btn btn-primary" type="button" onClick={() => updateComment(commentId)}>저장</button>
                      <button className="btn btn-ghost" type="button" onClick={() => setEditingCommentId(null)}>취소</button>
                    </div>
                  ) : (
                    <p>{c.content || c.body}</p>
                  )}
                </div>
              );
            }) : (
              <p className="muted">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
            )}
          </div>

          <form className="comment-form" onSubmit={submitComment}>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글을 입력하세요" />
            <button className="btn btn-primary">등록</button>
          </form>
        </section>
      </div>
    </Page>
  );
}
