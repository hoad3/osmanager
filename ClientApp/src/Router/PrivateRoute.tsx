import React from 'react'
import { Navigate } from 'react-router-dom'

const isAuthenticated = (): boolean => {
  const tokenData = localStorage.getItem('authTokens')
  if (!tokenData) return false
  try {
    const { jwtToken, expires } = JSON.parse(tokenData)
    if (!jwtToken) return false
    if (Date.now() > expires) {
      localStorage.removeItem('authTokens')
      return false
    }
    return true
  } catch {
    localStorage.removeItem('authTokens')
    return false
  }
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to='/' replace />
}

export default PrivateRoute
