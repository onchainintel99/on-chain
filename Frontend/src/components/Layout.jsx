import React, { useState } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useData } from '../lib/store';

const ROLE_LABELS = {
  user: 'User',
  manager1: 'Manager Stage 1',
  manager2: 'Manager Stage 2',
  admin: 'Administrator',
};

export default function Layout() {
  const {
    currentUser,
    logout,
  } = useData();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);


  const role = currentUser?.role;


  const getInitials = () => {
    if (!currentUser?.name) {
      return 'U';
    }

    return currentUser.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };


  const navigation = [];


  /*
   * USER NAVIGATION
   */
  if (role === 'user') {
    navigation.push(
      {
        to: '/',
        label: 'Dashboard',
        icon: '⌂',
        end: true,
      },
      {
        to: '/wallets',
        label: 'My Wallets',
        icon: '◈',
      },
      {
        to: '/create-wallet',
        label: 'Create Wallet',
        icon: '+',
      }
    );
  }


  /*
   * MANAGER STAGE 1
   */
  if (role === 'manager1') {
    navigation.push(
      {
        to: '/',
        label: 'Dashboard',
        icon: '⌂',
        end: true,
      },
      {
        to: '/manager/stage-1',
        label: 'Stage 1 Queue',
        icon: '◈',
      },
      {
        to: '/wallets',
        label: 'Wallet Pipeline',
        icon: '▤',
      }
    );
  }


  /*
   * MANAGER STAGE 2
   */
  if (role === 'manager2') {
    navigation.push(
      {
        to: '/',
        label: 'Dashboard',
        icon: '⌂',
        end: true,
      },
      {
        to: '/manager/stage-2',
        label: 'Stage 2 Queue',
        icon: '◈',
      },
      {
        to: '/wallets',
        label: 'Wallet Pipeline',
        icon: '▤',
      }
    );
  }


  /*
   * ADMIN
   */
  if (role === 'admin') {
    navigation.push(
      {
        to: '/',
        label: 'Dashboard',
        icon: '⌂',
        end: true,
      },
      {
        to: '/wallets',
        label: 'Wallet Pipeline',
        icon: '▤',
      },
      {
        to: '/admin',
        label: 'Admin Dashboard',
        icon: '◉',
      }
    );
  }


  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }


  return (
    <div className="shell">

      {/* ================================================ */}
      {/* SIDEBAR */}
      {/* ================================================ */}

      <aside
        className={`shell__sidebar ${
          sidebarOpen ? 'is-open' : ''
        }`}
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand__mark">
            ◆
          </div>

          <div className="brand__text">

            <span className="brand__name">
              Onchain Intelligence
            </span>

            <span className="brand__sub">
              Wallet Management
            </span>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="side-nav">

          <div className="side-nav__section-title">
            Workspace
          </div>

          {navigation.map((item) => (

            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() =>
                setSidebarOpen(false)
              }
              className={({ isActive }) =>
                `side-nav__link ${
                  isActive
                    ? 'is-active'
                    : ''
                }`
              }
            >

              <span className="side-nav__icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>

          ))}

        </nav>


        {/* USER AREA */}

        <div className="side-nav__footer">

          <div className="user-chip">

            <div className="user-chip__initials">
              {getInitials()}
            </div>

            <div className="user-chip__meta">

              <span className="user-chip__name">
                {currentUser?.name}
              </span>

              <span className="user-chip__role">
                {ROLE_LABELS[role]}
              </span>

            </div>

          </div>


          <button
            className="btn btn--ghost btn--full"
            onClick={handleLogout}
          >
            Log out
          </button>

        </div>

      </aside>


      {/* ================================================ */}
      {/* MAIN */}
      {/* ================================================ */}

      <div className="shell__main">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="topbar__menu-btn"
            onClick={() =>
              setSidebarOpen(
                (value) => !value
              )
            }
          >
            <span />
            <span />
            <span />
          </button>


          <div className="topbar__right">

            <div className="topbar__status">

              <span className="live-dot" />

              Live approval system

            </div>

            <div className="topbar__role">
              {ROLE_LABELS[role]}
            </div>

          </div>

        </header>


        {/* CONTENT */}

        <main className="shell__content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}