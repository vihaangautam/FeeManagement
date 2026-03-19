const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
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
      // Token expired — clear and redirect to login
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

// ── Batches ───────────────────────────────────────────

export const fetchBatches = () => request('/api/batches');
export const fetchBatch = (id) => request(`/api/batches/${id}`);
export const createBatch = (data) => request('/api/batches', { method: 'POST', body: JSON.stringify(data) });
export const updateBatch = (id, data) => request(`/api/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBatch = (id) => request(`/api/batches/${id}`, { method: 'DELETE' });

// ── Students ──────────────────────────────────────────

export const fetchStudents = (batchId) => {
  const params = batchId ? `?batch_id=${batchId}` : '';
  return request(`/api/students${params}`);
};
export const fetchStudent = (id) => request(`/api/students/${id}`);
export const createStudent = (data) => request('/api/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id, data) => request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStudent = (id) => request(`/api/students/${id}`, { method: 'DELETE' });

// ── Fees ──────────────────────────────────────────────

export const fetchFees = (month, year) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  return request(`/api/fees?${params}`);
};
export const fetchFeeStatus = (month, year) => request(`/api/fees/status?month=${month}&year=${year}`);
export const fetchStudentFees = (studentId) => request(`/api/fees/student/${studentId}`);
export const createFee = (data) => request('/api/fees', { method: 'POST', body: JSON.stringify(data) });
export const deleteFee = (id) => request(`/api/fees/${id}`, { method: 'DELETE' });
export const exportFees = (month, year) => request(`/api/fees/export?month=${month}&year=${year}`);

export const exportFeesAdvanced = async (year) => {
  const url = `${API_BASE}/api/fees/export/advanced?year=${year}`;
  const token = localStorage.getItem('tt_token');
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      window.location.href = '/login';
      return;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return res.blob();
};

// ── Dashboard ─────────────────────────────────────────

export const fetchDashboard = () => request('/api/dashboard');
