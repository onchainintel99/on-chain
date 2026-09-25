const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


/* =========================================================
   TOKEN
========================================================= */

export function getToken() {
  return localStorage.getItem(
    "onchain-intel:token"
  );
}


export function setToken(token) {
  if (token) {
    localStorage.setItem(
      "onchain-intel:token",
      token
    );
  } else {
    localStorage.removeItem(
      "onchain-intel:token"
    );
  }
}


/* =========================================================
   REQUEST
========================================================= */

async function request(
  path,
  options = {}
) {
  const token =
    getToken();


  const headers = {
    "Content-Type":
      "application/json",

    ...(options.headers || {}),
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Request failed"
    );
  }


  return data;
}


/* =========================================================
   AUTH
========================================================= */

export const loginRequest =
  (
    email,
    password
  ) =>
    request(
      "/auth/login",
      {
        method: "POST",

        body:
          JSON.stringify({
            email,
            password,
          }),
      }
    );


export const signupRequest =
  (payload) =>
    request(
      "/auth/register",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


export const meRequest =
  () =>
    request(
      "/auth/me"
    );


/* =========================================================
   DASHBOARD
========================================================= */

export const overviewRequest =
  () =>
    request(
      "/dashboard/overview"
    );


export const adminOverviewRequest =
  () =>
    request(
      "/dashboard/admin"
    );


/* =========================================================
   WALLETS
========================================================= */

export const walletsRequest =
  (params = "") =>
    request(
      `/wallets${
        params
          ? `?${params}`
          : ""
      }`
    );


export const walletRequest =
  (id) =>
    request(
      `/wallets/${id}`
    );


export const createWalletRequest =
  (payload) =>
    request(
      "/wallets",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   STAGE 1
========================================================= */

export const stage1DecisionRequest =
  (
    id,
    payload
  ) =>
    request(
      `/wallets/${id}/stage1-decision`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   STAGE 2 SUBMISSION
========================================================= */

export const stage2SubmitRequest =
  (
    id,
    payload
  ) =>
    request(
      `/wallets/${id}/stage2-submit`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   STAGE 2 APPROVAL
========================================================= */

export const stage2DecisionRequest =
  (
    id,
    payload
  ) =>
    request(
      `/wallets/${id}/stage2-decision`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   STAGE 3 FINAL ADMIN
========================================================= */

export const stage3DecisionRequest =
  (
    id,
    payload
  ) =>
    request(
      `/wallets/${id}/stage3-decision`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   NOTES
========================================================= */

export const addNoteRequest =
  (
    id,
    payload
  ) =>
    request(
      `/wallets/${id}/notes`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );


/* =========================================================
   STAFF
========================================================= */

export const createStaffRequest =
  (payload) =>
    request(
      "/admin/staff",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );