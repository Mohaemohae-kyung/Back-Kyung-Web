const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080';

export function getStoredUser() {

  try {

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );

  } catch {

    return null;

  }
}

export function saveAuth(result) {

  localStorage.setItem(
    'accessToken',
    result.accessToken
  );

  localStorage.setItem(
    'refreshToken',
    result.refreshToken
  );

  localStorage.setItem(
    'user',
    JSON.stringify(result)
  );
}

export function updateStoredUser(nextUser) {

  const prev = getStoredUser() || {};

  const merged = {
    ...prev,
    ...nextUser
  };

  localStorage.setItem(
    'user',
    JSON.stringify(merged)
  );

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

    headers['Content-Type'] =
      'application/json';
  }

  const token =
    localStorage.getItem('accessToken');

  console.log('현재 토큰:', token);

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
}

async function tryReissueToken() {

  const refreshToken =
    localStorage.getItem('refreshToken');

  if (!refreshToken) {

    console.error(
      '리프레시 토큰 없음'
    );

    clearAuth();

    window.location.href = '/login';

    return false;
  }

  try {

    console.log(
      '토큰 재발급 요청 시작'
    );

    const res = await fetch(
      `${BASE_URL}/api/auth/reissue`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );

    const data = await res.json();

    console.log(
      '재발급 응답:',
      data
    );

    if (
      !res.ok ||
      data?.isSuccess === false
    ) {

      console.error(
        '토큰 재발급 실패'
      );

      clearAuth();

      window.location.href = '/login';

      return false;
    }

    const newAccessToken =
      data?.result?.accessToken;

    const newRefreshToken =
      data?.result?.refreshToken;

    if (!newAccessToken) {

      console.error(
        '새 accessToken 없음'
      );

      clearAuth();

      window.location.href = '/login';

      return false;
    }

    localStorage.setItem(
      'accessToken',
      newAccessToken
    );

    if (newRefreshToken) {

      localStorage.setItem(
        'refreshToken',
        newRefreshToken
      );
    }

    console.log(
      '토큰 재발급 완료'
    );

    return true;

  } catch (e) {

    console.error(
      '재발급 중 오류:',
      e
    );

    clearAuth();

    window.location.href = '/login';

    return false;
  }
}

async function uploadFile(domain, file) {

  const formData = new FormData();

  formData.append('file', file);

  const headers =
    createAuthHeaders(false);

  let res = await fetch(

    `${BASE_URL}/api/files?domain=${encodeURIComponent(domain)}`,

    {
      method: 'POST',
      headers,
      body: formData,
    }
  );

  // =========================
  // 401 발생 시 재발급
  // =========================

  if (res.status === 401) {

    console.log(
      '파일 업로드 401 → 재발급 시도'
    );

    const success =
      await tryReissueToken();

    if (success) {

      const retryHeaders =
        createAuthHeaders(false);

      res = await fetch(

        `${BASE_URL}/api/files?domain=${encodeURIComponent(domain)}`,

        {
          method: 'POST',
          headers: retryHeaders,
          body: formData,
        }
      );
    }
  }

  let data = null;

  try {

    data = await res.json();

  } catch {}

  if (
    !res.ok ||
    data?.isSuccess === false
  ) {

    const error = new Error(

      data?.message ||

      `파일 업로드 실패: ${res.status}`
    );

    error.response = {
      status: res.status,
      data
    };

    throw error;
  }

  return data || { result: null };
}

async function request(
  method,
  path,
  body
) {

  let headers =
    createAuthHeaders(true);

  console.log(
    '요청 헤더:',
    headers
  );

  let res = await fetch(

    `${BASE_URL}${path}`,

    {
      method,
      headers,
      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  );

  // =========================
  // 401 발생 시 재발급
  // =========================

  if (res.status === 401) {

    console.log(
      '401 발생 → 토큰 재발급 시도'
    );

    const success =
      await tryReissueToken();

    if (success) {

      headers =
        createAuthHeaders(true);

      console.log(
        '원래 요청 재시도'
      );

      res = await fetch(

        `${BASE_URL}${path}`,

        {
          method,
          headers,
          body: body
            ? JSON.stringify(body)
            : undefined,
        }
      );
    }
  }

  let data = null;

  try {

    data = await res.json();

  } catch {}

  // =========================
  // API 실패 처리
  // =========================

  if (
    !res.ok ||
    data?.isSuccess === false
  ) {

    console.error(
      'API 실패:',
      data
    );

    const error = new Error(

      data?.message ||

      `API 오류: ${res.status}`
    );

    error.response = {
      status: res.status,
      data
    };

    throw error;
  }

  return data || { result: null };
}

export const api = {

  get: (path) =>
    request('GET', path),

  post: (path, body) =>
    request('POST', path, body),

  patch: (path, body) =>
    request('PATCH', path, body),

  delete: (path, body) =>
    request('DELETE', path, body),

  uploadFile,
};