import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginRequest,
  signupRequest,
  meRequest,
  setToken,
  getToken,

  overviewRequest,
  adminOverviewRequest,
  leaderboardRequest,

  walletsRequest,
  walletRequest,
  createWalletRequest,

  stage1DecisionRequest,
  stage2SubmitRequest,
  stage2DecisionRequest,
  stage3DecisionRequest,

  addNoteRequest,

  createStaffRequest,
} from "./api";


const DataContext =
  createContext(null);


export function DataProvider({
  children,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    authLoading,
    setAuthLoading,
  ] = useState(
    Boolean(
      getToken()
    )
  );


  /* =========================================================
     RESTORE LOGIN
  ========================================================= */

  useEffect(() => {
    if (!getToken()) {
      setAuthLoading(false);
      return;
    }


    meRequest()
      .then(
        (data) =>
          setCurrentUser(
            data.user
          )
      )
      .catch(() => {
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);


  /* =========================================================
     LOGIN
  ========================================================= */

  async function login(
    email,
    password
  ) {
    const data =
      await loginRequest(
        email,
        password
      );


    setToken(
      data.token
    );


    setCurrentUser(
      data.user
    );


    return data.user;
  }


  /* =========================================================
     SIGNUP
  ========================================================= */

  async function signup(
    payload
  ) {
    return signupRequest(
      payload
    );
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    setToken(null);

    setCurrentUser(null);
  }


  const value = {
    currentUser,

    authLoading,

    login,

    signup,

    logout,


    /* Dashboard */

    getOverview:
      overviewRequest,

    getAdminOverview:
      adminOverviewRequest,
    
    /* Leaderboard */

getLeaderboard:
  leaderboardRequest,


    /* Wallets */

    getWallets:
      walletsRequest,

    getWallet:
      walletRequest,

    createWallet:
      createWalletRequest,


    /* Stage 1 */

    stage1Decision:
      stage1DecisionRequest,


    /* Stage 2 */

    submitStage2:
      stage2SubmitRequest,

    stage2Decision:
      stage2DecisionRequest,


    /* Stage 3 */

    stage3Decision:
      stage3DecisionRequest,


    /* Notes */

    addNote:
      addNoteRequest,


    /* Staff */

    createStaff:
      createStaffRequest,
  };


  return (
    <DataContext.Provider
      value={value}
    >
      {children}
    </DataContext.Provider>
  );
}


export function useData() {
  const value =
    useContext(
      DataContext
    );


  if (!value) {
    throw new Error(
      "useData must be used inside DataProvider"
    );
  }


  return value;
}