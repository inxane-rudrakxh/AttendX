import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('attendx_token')
    const stored = localStorage.getItem('attendx_user')
    if (token && stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, role, name, user_id } = res.data
    const userData = { id: user_id, name, email, role, token: access_token }
    localStorage.setItem('attendx_token', access_token)
    localStorage.setItem('attendx_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    const { access_token, role, name, user_id } = res.data
    const userData = { id: user_id, name, email: payload.email, role, token: access_token }
    localStorage.setItem('attendx_token', access_token)
    localStorage.setItem('attendx_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('attendx_token')
    localStorage.removeItem('attendx_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
