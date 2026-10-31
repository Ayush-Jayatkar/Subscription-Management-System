import api from '../../services/api'

export const financeApi = {
  discounts: (params = {}) => api.get('/discounts', { params }).then(r => r.data),
  createDiscount: (payload) => api.post('/discounts', payload).then(r => r.data),
  quoteDiscount: (payload) => api.post('/discounts/quote', payload).then(r => r.data),
  payments: (params = {}) => api.get('/payments', { params }).then(r => r.data),
  createPayment: (payload) => api.post('/payments', payload).then(r => r.data),
  summary: () => api.get('/reports/summary').then(r => r.data),
}
