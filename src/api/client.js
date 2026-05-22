const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function saveAuth(result) {
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  localStorage.setItem('user', JSON.stringify(result));
}

export function updateStoredUser(nextUser) {
  const prev = getStoredUser() || {};
  const merged = { ...prev, ...nextUser };

  localStorage.setItem('user', JSON.stringify(merged));

  return merged;
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function createAuthHeaders(isJson = true) {
  const headers = {};

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('accessToken');

  console.log('현재 토큰:', token);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function uploadFile(domain, file) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = createAuthHeaders(false);

  const res = await fetch(
    `${BASE_URL}/api/files?domain=${encodeURIComponent(domain)}`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  );

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if (!res.ok || data?.isSuccess === false) {
    throw new Error(data?.message || `파일 업로드 실패: ${res.status}`);
  }

  return data || { result: null };
}

async function request(method, path, body) {
  const headers = createAuthHeaders(true);

  console.log('요청 헤더:', headers);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if (!res.ok || data?.isSuccess === false) {
    console.error('API 실패:', data);

    throw new Error(data?.message || `API 오류: ${res.status}`);
  }

  return data || { result: null };
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path, body) => request('DELETE', path, body),
  uploadFile,
};