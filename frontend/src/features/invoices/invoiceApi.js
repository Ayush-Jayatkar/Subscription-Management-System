
import api from '../../services/api'

export const invoiceApi = {
  list: (params = {}) =>
    api.get('/invoices', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/invoices/${id}`).then(r => r.data),

  generate: (subscriptionId) =>
    api.post(`/invoices/from-subscription/${subscriptionId}`).then(r => r.data),

  confirm: (id) =>
    api.post(`/invoices/${id}/confirm`).then(r => r.data),

  cancel: (id) =>
    api.post(`/invoices/${id}/cancel`).then(r => r.data),

  send: (id) =>
    api.post(`/invoices/${id}/send`).then(r => r.data),

  downloadPdf: async (id) => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    })

    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
