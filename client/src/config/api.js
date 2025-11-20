// export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';

// export async function apiFetch(path, opts = {}) {
//   const token = localStorage.getItem('token');
//   const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
//   const json = await res.json().catch(() => null);

//   if (!res.ok) {
//     throw json || { message: res.statusText || 'Network error' };
//   }
//   return json;
// }

// export default { API_BASE_URL, apiFetch };

// client/src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw json || { message: res.statusText || 'Network error' };
  }
  return json;
}
