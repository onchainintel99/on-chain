import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  loginRequest, signupRequest, meRequest, setToken, getToken,
  overviewRequest, adminOverviewRequest, walletsRequest, walletRequest,
  createWalletRequest, manager1DecisionRequest, stage2SubmitRequest, manager2DecisionRequest, createStaffRequest
} from './api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return setAuthLoading(false)
    meRequest().then((data) => setCurrentUser(data.user)).catch(() => setToken(null)).finally(() => setAuthLoading(false))
  }, [])

  async function login(email, password) {
    const data = await loginRequest(email, password)
    setToken(data.token); setCurrentUser(data.user); return data.user
  }
  async function signup(payload) {
    const data = await signupRequest(payload)
    return data
  }
  function logout() { setToken(null); setCurrentUser(null) }

  const value = {
    currentUser, authLoading, login, signup, logout,
    getOverview: overviewRequest,
    getAdminOverview: adminOverviewRequest,
    getWallets: (params) => walletsRequest(params),
    getWallet: walletRequest,
    createWallet: createWalletRequest,
    manager1Decision: manager1DecisionRequest,
    submitStage2: stage2SubmitRequest,
    manager2Decision: manager2DecisionRequest,
    createStaff: createStaffRequest,
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
