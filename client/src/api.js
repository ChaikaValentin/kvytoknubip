async function request(path, options = {}) {
  const { headers, ...rest } = options
  const res = await fetch(path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (path, headers) => request(path, { headers }),
  post: (path, body, headers) => request(path, { method: 'POST', body: JSON.stringify(body), headers }),
  put: (path, body, headers) => request(path, { method: 'PUT', body: JSON.stringify(body), headers }),
  del: (path, headers) => request(path, { method: 'DELETE', headers })
}

export function getAdminKey() {
  return localStorage.getItem('kvytok_admin_key') || ''
}

export function setAdminKey(key) {
  if (key) localStorage.setItem('kvytok_admin_key', key)
  else localStorage.removeItem('kvytok_admin_key')
}

export function adminHeaders() {
  return { 'X-Admin-Key': getAdminKey() }
}

export function getSavedOrderIds() {
  try {
    const ids = JSON.parse(localStorage.getItem('kvytok_orders') || '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function saveOrderId(id) {
  const ids = getSavedOrderIds()
  if (!ids.includes(id)) ids.push(id)
  localStorage.setItem('kvytok_orders', JSON.stringify(ids))
}
