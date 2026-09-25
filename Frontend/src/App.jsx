import React from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { DataProvider } from "./lib/store";

import {
  RequireAuth,
  RequireRole,
} from "./components/ProtectedRoute";

import Layout from "./components/Layout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateWallet from "./pages/AddWallet";
import Wallets from "./pages/Wallets";
import WalletDetail from "./pages/WalletDetail";
import Admin from "./pages/Admin";
import Leaderboard from "./pages/Leaderboard";

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
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* =================================================
              PROTECTED APP
              Leaderboard belongs inside Layout so it receives
              the normal sidebar/header shell.
          ================================================= */}

          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/pipeline"
              element={<Wallets />}
            />

            <Route
              path="/wallets"
              element={<Wallets />}
            />

            <Route
              path="/wallets/:id"
              element={<WalletDetail />}
            />

            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />

            {/* =================================================
                ONLY NORMAL USER CAN CREATE WALLET
            ================================================= */}

            <Route
              path="/create-wallet"
              element={
                <RequireRole roles={["user"]}>
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
                <RequireRole roles={["admin"]}>
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