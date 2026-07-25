import { useState, useCallback } from 'react'
import { api, setToken, clearToken, isAuthenticated } from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ahilney_admin_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback(async (email, password) => {
    const data = await api.adminLogin(email, password)
    setToken(data.token)
    const profile = { name: data.name || email.split('@')[0], email, role: data.role || 'Admin' }
    localStorage.setItem('ahilney_admin_user', JSON.stringify(profile))
    setUser(profile)
    return data
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem('ahilney_admin_user')
    setUser(null)
  }, [])

  return { user, login, logout, isAuthenticated: isAuthenticated() }
}
