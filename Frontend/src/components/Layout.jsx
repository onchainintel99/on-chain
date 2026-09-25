import React, { useState } from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useData } from "../lib/store";
import logo from "../assets/logo-icon.png";


const ROLE_LABELS = {
  user: "User",
  manager1: "Manager 1",
  manager2: "Manager 2",
  admin: "Administrator",
};


export default function Layout() {

  const {
    currentUser,
    logout,
  } = useData();


  const navigate = useNavigate();


  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  const role =
    currentUser?.role;


  /* =========================================================
     USER INITIALS
  ========================================================= */

  const getInitials = () => {

    if (!currentUser?.name) {
      return "U";
    }


    return currentUser.name
      .split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };


  /* =========================================================
     COMMON NAVIGATION
     
     EVERY ROLE GETS:
     
     Dashboard
     Pipeline
     All Wallets
     Leaderboard
  ========================================================= */

  const navigation = [

    {
      to: "/",
      label: "Dashboard",
      icon: "⌂",
      end: true,
    },


    {
      to: "/pipeline",
      label: "Pipeline",
      icon: "⇢",
    },


    {
      to: "/wallets",
      label: "All Wallets",
      icon: "◈",
    },


    {
      to: "/leaderboard",
      label: "Leaderboard",
      icon: "🏆",
    },

  ];


  /* =========================================================
     ADD WALLET
     
     ONLY NORMAL USER
     
     User       ✅
     Manager 1  ❌
     Manager 2  ❌
     Admin      ❌
  ========================================================= */

  if (
    role === "user"
  ) {

    navigation.push({

      to: "/create-wallet",

      label: "Add Wallet",

      icon: "+",

    });

  }


  /* =========================================================
     ADMIN
     
     ONLY ADMIN
  ========================================================= */

  if (
    role === "admin"
  ) {

    navigation.push({

      to: "/admin",

      label: "Admin",

      icon: "◆",

    });

  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {

    logout();


    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }


  /* =========================================================
     CLOSE SIDEBAR
  ========================================================= */

  function closeSidebar() {

    setSidebarOpen(false);

  }


  return (

    <div className="app-shell">


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (

        <button

          type="button"

          className="sidebar-overlay"

          aria-label="Close menu"

          onClick={
            closeSidebar
          }

        />

      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside

        className={`sidebar ${
          sidebarOpen
            ? "sidebar--open"
            : ""
        }`}

      >


        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="sidebar__brand">


          <div className="sidebar__logo">

            <img
              src={logo}
              alt="Onchain Intelligence"
            />

          </div>


          <div>

            <div className="sidebar__brand-name">

              Onchain Intelligence

            </div>


            <div className="sidebar__brand-sub">

              Wallet Research

            </div>

          </div>


        </div>


        {/* ===================================================
            ROLE
        =================================================== */}

        <div className="sidebar__role">

          {ROLE_LABELS[role] || role}

        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav
          className="sidebar__nav"
          aria-label="Main navigation"
        >

          {navigation.map(
            (item) => (

              <NavLink

                key={item.to}

                to={item.to}

                end={item.end}

                className={({
                  isActive,
                }) =>

                  `sidebar__link ${
                    isActive
                      ? "sidebar__link--active"
                      : ""
                  }`

                }

                onClick={
                  closeSidebar
                }

              >

                <span
                  className="sidebar__link-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>


                <span>
                  {item.label}
                </span>


              </NavLink>

            )
          )}

        </nav>


        {/* ===================================================
            USER FOOTER
        =================================================== */}

        <div className="sidebar__footer">


          <div className="sidebar-user">


            <div className="sidebar-user__avatar">

              {getInitials()}

            </div>


            <div className="sidebar-user__info">


              <strong>

                {currentUser?.name ||
                  "User"}

              </strong>


              <span>

                {currentUser?.email ||
                  ""}

              </span>


            </div>


          </div>


          {/* =================================================
              LOGOUT
          ================================================= */}

          <button

            type="button"

            className="btn btn--ghost sidebar-logout"

            onClick={
              handleLogout
            }

          >

            Logout

          </button>


        </div>


      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="shell">


        {/* ===================================================
            MOBILE MENU BUTTON
        =================================================== */}

        <button

          type="button"

          className="mobile-menu-btn"

          aria-label="Open menu"

          onClick={() =>
            setSidebarOpen(true)
          }

        >

          ☰

        </button>


        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <div className="shell__content">

          <Outlet />

        </div>


      </main>


    </div>

  );
}