import api from '../../services/api'
const auth = () => ({ headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } })
const pageParams = (params = {}) => ({ page: 1, page_size: 10, ...params })
export const listSubscriptions = (params) => api.get('/subscriptions', { ...auth(), params: pageParams(params) }).then(r => r.data)
export const getSubscription = (id) => api.get(`/subscriptions/${id}`, auth()).then(r => r.data)
export const createSubscription = (body) => api.post('/subscriptions', body, auth()).then(r => r.data)
export const transition = (id, to) => api.post(`/subscriptions/${id}/transition`, { to }, auth()).then(r => r.data)
export const pause = (id) => api.post(`/subscriptions/${id}/pause`, {}, auth()).then(r => r.data)
export const resume = (id) => api.post(`/subscriptions/${id}/resume`, {}, auth()).then(r => r.data)
export const renew = (id) => api.post(`/subscriptions/${id}/renew`, {}, auth()).then(r => r.data)
export const close = (id) => api.post(`/subscriptions/${id}/close`, {}, auth()).then(r => r.data)
export const listInvoices = (params) => api.get('/invoices', { ...auth(), params: pageParams(params) }).then(r => r.data)
export const getInvoice = (id) => api.get(`/invoices/${id}`, auth()).then(r => r.data)
export const confirmInvoice = (id) => api.post(`/invoices/${id}/confirm`, {}, auth()).then(r => r.data)
export const cancelInvoice = (id) => api.post(`/invoices/${id}/cancel`, {}, auth()).then(r => r.data)
export const sendInvoice = (id) => api.post(`/invoices/${id}/send`, {}, auth()).then(r => r.data)
export const invoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { ...auth(), responseType: 'blob' }).then(r => r.data)
export const runBilling = () => api.post('/billing/run', {}, auth()).then(r => r.data)
export const mySubscriptions = (params) => api.get('/me/subscriptions', { ...auth(), params: pageParams(params) }).then(r => r.data)
export const myInvoices = (params) => api.get('/me/invoices', { ...auth(), params: pageParams(params) }).then(r => r.data)
export function errMsg(e) {
  const detail = e?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(x => x.msg || String(x)).join(', ')
  return 'Something went wrong. Please try again.'
}
