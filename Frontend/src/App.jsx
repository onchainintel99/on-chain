import React from 'react';

import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { DataProvider } from './lib/store';

import {
  RequireAuth,
  RequireRole,
} from './components/ProtectedRoute';

import Layout from './components/Layout';

import Login from './pages/Login';
import Signup from './pages/Signup';

import Dashboard from './pages/Dashboard';
import CreateWallet from './pages/AddWallet';
import Wallets from './pages/Wallets';
import WalletDetail from './pages/WalletDetail';

import Manager1 from './pages/Manager1';
import Manager2 from './pages/Manager2';

import Admin from './pages/Admin';


export default function App() {
  return (
    <DataProvider>

      <HashRouter>

        <Routes>

          {/* =====================================================
              AUTHENTICATION
          ===================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />


          {/* =====================================================
              PROTECTED APPLICATION
          ===================================================== */}

          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >

            {/* =================================================
                USER DASHBOARD
            ================================================= */}

            <Route
              path="/"
              element={<Dashboard />}
            />


            {/* =================================================
                ALL WALLETS
            ================================================= */}

            <Route
              path="/wallets"
              element={<Wallets />}
            />


            {/* =================================================
                WALLET DETAILS

                Stage 2 form is displayed inside WalletDetail.jsx
                after Manager Stage 1 approves the wallet.
            ================================================= */}

            <Route
              path="/wallets/:id"
              element={<WalletDetail />}
            />


            {/* =================================================
                CREATE WALLET
                USER ONLY
            ================================================= */}

            <Route
              path="/create-wallet"
              element={
                <RequireRole roles={['user']}>
                  <CreateWallet />
                </RequireRole>
              }
            />


            {/* =================================================
                MANAGER STAGE 1
            ================================================= */}

            <Route
              path="/manager/stage-1"
              element={
                <RequireRole roles={['manager1']}>
                  <Manager1 />
                </RequireRole>
              }
            />


            {/* =================================================
                MANAGER STAGE 2
            ================================================= */}

            <Route
              path="/manager/stage-2"
              element={
                <RequireRole roles={['manager2']}>
                  <Manager2 />
                </RequireRole>
              }
            />


            {/* =================================================
                ADMIN
            ================================================= */}

            <Route
              path="/admin"
              element={
                <RequireRole roles={['admin']}>
                  <Admin />
                </RequireRole>
              }
            />

          </Route>


          {/* =====================================================
              FALLBACK
          ===================================================== */}

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