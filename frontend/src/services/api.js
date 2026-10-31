import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brightloop_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function getSystemStatus() {
  const response = await api.get('/system/status')
  return response.data
}

export default api
