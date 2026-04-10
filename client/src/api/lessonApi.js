const API_BASE = import.meta.env.VITE_API_URL || '';

async function lessonRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('tt_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      window.location.href = '/login';
      return;
    }
    const err = await res.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Lesson API ────────────────────────────────────────

export const generateLesson = (data) =>
  lessonRequest('/api/lessons/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const searchImages = (query, limit = 8) =>
  lessonRequest(`/api/lessons/image-search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const saveLesson = (data) =>
  lessonRequest('/api/lessons/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchLessons = () =>
  lessonRequest('/api/lessons');

export const fetchLesson = (id) =>
  lessonRequest(`/api/lessons/${id}`);

export const deleteLesson = (id) =>
  lessonRequest(`/api/lessons/${id}`, { method: 'DELETE' });
