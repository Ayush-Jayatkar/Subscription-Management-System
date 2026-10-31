import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('brightloop_access_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('brightloop_access_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('brightloop_access_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    await api.post('/auth/register', payload)
    return login(payload.email, payload.password)
  }

  function logout() {
    localStorage.removeItem('brightloop_access_token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
