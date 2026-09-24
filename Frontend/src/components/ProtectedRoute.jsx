import React from 'react'
import { Navigate } from 'react-router-dom'
import { useData } from '../lib/store'

export function RequireAuth({ children }) {
  const { currentUser, authLoading } = useData()
  if (authLoading) return <div className="auth-loading">Checking your session…</div>
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

export function RequireRole({ roles, children }) {
  const { currentUser, authLoading } = useData()
  if (authLoading) return <div className="auth-loading">Checking your session…</div>
  if (!currentUser) return <Navigate to="/login" replace />
  if (!roles.includes(currentUser.role)) return <Navigate to="/" replace />
  return children
}
