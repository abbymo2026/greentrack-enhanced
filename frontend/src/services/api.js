
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function http(method, path, { body, headers } = {}) {
  const opts = { method, headers: { ...(headers || {}) } };
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body; // browser sets content-type
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const api = {
  // Grants
  listGrants: () => http('GET', '/grants'),
  getGrant: (id) => http('GET', `/grants/${id}`),

  // Files
  listFiles: (grantId) => http('GET', `/grants/${grantId}/files`),
  uploadFile: (grantId, data) => http('POST', `/grants/${grantId}/files`, { body: data }),
  deleteFile: (fileId) => http('DELETE', `/files/${fileId}`),
  downloadFileUrl: (fileId) => `${API_BASE}/files/${fileId}/download`,

  // Outcomes
  postOutcome: (grantId, payload) => http('POST', `/grants/${grantId}/outcome`, { body: payload }),

  // Communications
  listComms: (grantId) => http('GET', `/grants/${grantId}/communications`),
  addComm: (grantId, payload) => http('POST', `/grants/${grantId}/communications`, { body: payload }),
  deleteComm: (id) => http('DELETE', `/communications/${id}`),

  // Dashboard
  stats: () => http('GET', '/dashboard/stats'),
};
