import React from "react";

import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  DataProvider,
} from "./lib/store";

import {
  RequireAuth,
  RequireRole,
} from "./components/ProtectedRoute";

import Layout from "./components/Layout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";

import CreateWallet
  from "./pages/AddWallet";

import Wallets
  from "./pages/Wallets";

import WalletDetail
  from "./pages/WalletDetail";

import Admin
  from "./pages/Admin";


export default function App() {
  return (
    <DataProvider>

      <HashRouter>

        <Routes>

          {/* =================================================
              AUTH
          ================================================= */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />

          <Route
            path="/signup"
            element={
              <Signup />
            }
          />


          {/* =================================================
              PROTECTED APP
          ================================================= */}

          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >

            {/* Dashboard */}

            <Route
              path="/"
              element={
                <Dashboard />
              }
            />


            {/* Pipeline */}

            <Route
              path="/pipeline"
              element={
                <Wallets />
              }
            />


            {/* Wallet list */}

            <Route
              path="/wallets"
              element={
                <Wallets />
              }
            />


            {/* Wallet detail */}

            <Route
              path="/wallets/:id"
              element={
                <WalletDetail />
              }
            />


            {/* =================================================
                ONLY NORMAL USER CAN CREATE WALLET
            ================================================= */}

            <Route
              path="/create-wallet"
              element={
                <RequireRole
                  roles={[
                    "user",
                  ]}
                >
                  <CreateWallet />
                </RequireRole>
              }
            />


            {/* =================================================
                ADMIN
            ================================================= */}

            <Route
              path="/admin"
              element={
                <RequireRole
                  roles={[
                    "admin",
                  ]}
                >
                  <Admin />
                </RequireRole>
              }
            />

          </Route>


          {/* =================================================
              FALLBACK
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </HashRouter>

    </DataProvider>
  );
}