import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('examos_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('examos_token', data.access_token)
    localStorage.setItem('examos_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password })
    localStorage.setItem('examos_token', data.access_token)
    localStorage.setItem('examos_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('examos_token')
    localStorage.removeItem('examos_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
