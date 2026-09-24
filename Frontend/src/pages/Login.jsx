import React, { useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useData } from '../lib/store';

export default function Login() {
  const {
    login,
    currentUser,
  } = useData();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  if (currentUser) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError(
        'Enter email and password.'
      );

      return;
    }

    setLoading(true);

    try {
      await login(
        email.trim(),
        password
      );

      navigate('/', {
        replace: true,
      });

    } catch (err) {
      setError(
        err.message ||
        'Unable to sign in.'
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-page">

      {/* ================================================= */}
      {/* LEFT SIDE */}
      {/* ================================================= */}

      <section className="login-page__left">

        {/* Brand */}

        <div className="login-brand">

          <div className="login-brand__mark">
            ◆
          </div>

          <div>
            <h2 className="login-brand__name">
              Onchain Intelligence
            </h2>

            <p className="login-brand__sub">
              Wallet Research Desk
            </p>
          </div>

        </div>


        {/* Login content */}

        <div className="login-content">

          <p className="login-eyebrow">
            SECURE ACCESS
          </p>

          <h1 className="login-title">
            Sign in to the
            <br />
            approval desk
          </h1>

          <p className="login-description">
            Manage wallets through Stage 1
            and Stage 2 approval, and track
            every wallet from creation to
            final approval.
          </p>


          {/* Login form */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* Email */}

            <label className="login-field">

              <span className="login-field__label">
                Email
              </span>

              <input
                className="login-field__input"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
              />

            </label>


            {/* Password */}

            <label className="login-field">

              <span className="login-field__label">
                Password
              </span>

              <input
                className="login-field__input"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />

            </label>


            {/* Existing signup message */}

            {location.state?.message && (
              <p className="login-success">
                {location.state.message}
              </p>
            )}


            {/* Error */}

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}


            {/* Submit */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>

          </form>


          {/* Signup */}

          <p className="login-signup">

            New user?{' '}

            <Link to="/signup">
              Create an account
            </Link>

          </p>

        </div>

      </section>


      {/* ================================================= */}
      {/* RIGHT SIDE */}
      {/* ================================================= */}

      <section className="login-page__right">

        <div className="login-visual">

          <p className="login-visual__eyebrow">
            ONCHAIN APPROVAL DESK
          </p>

          <h2 className="login-visual__title">
            Every wallet follows
            <br />
            a clear approval path.
          </h2>

          <p className="login-visual__description">
            Create wallets, complete Stage 1
            verification, submit pricing details,
            and move through Stage 2 approval.
          </p>


          {/* Workflow */}

          <div className="login-workflow">

            <div className="login-workflow__item">

              <span className="login-workflow__number">
                01
              </span>

              <span>
                Create Wallet
              </span>

            </div>


            <div className="login-workflow__line" />


            <div className="login-workflow__item">

              <span className="login-workflow__number">
                02
              </span>

              <span>
                Stage 1 Approval
              </span>

            </div>


            <div className="login-workflow__line" />


            <div className="login-workflow__item">

              <span className="login-workflow__number">
                03
              </span>

              <span>
                Stage 2 Approval
              </span>

            </div>


            <div className="login-workflow__line" />


            <div className="login-workflow__item login-workflow__item--success">

              <span className="login-workflow__number">
                ✓
              </span>

              <span>
                Successful
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}