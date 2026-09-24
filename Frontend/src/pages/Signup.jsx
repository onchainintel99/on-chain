import React, { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { useData } from '../lib/store';

export default function Signup() {
  const {
    signup,
    currentUser,
  } = useData();

  const navigate = useNavigate();


  // ==================================================
  // FORM STATE
  // ==================================================

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });


  // ==================================================
  // UI STATE
  // ==================================================

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  // ==================================================
  // REDIRECT IF ALREADY LOGGED IN
  // ==================================================

  if (currentUser) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // ==================================================
  // UPDATE FORM FIELD
  // ==================================================

  const setField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };


  // ==================================================
  // SUBMIT SIGNUP
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');


    // --------------------------------------------------
    // Required fields
    // --------------------------------------------------

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm
    ) {
      setError(
        'Fill all required fields.'
      );

      return;
    }


    // --------------------------------------------------
    // Email validation
    // --------------------------------------------------

    if (
      !/^\S+@\S+\.\S+$/.test(
        form.email.trim()
      )
    ) {
      setError(
        'Enter a valid email address.'
      );

      return;
    }


    // --------------------------------------------------
    // Password length
    // --------------------------------------------------

    if (form.password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      );

      return;
    }


    // --------------------------------------------------
    // Password confirmation
    // --------------------------------------------------

    if (
      form.password !== form.confirm
    ) {
      setError(
        'Passwords do not match.'
      );

      return;
    }


    setLoading(true);


    try {

      // Create normal USER account
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });


      /*
       * IMPORTANT:
       *
       * Do NOT automatically log the user in.
       *
       * After signup:
       *
       * Signup
       *   ↓
       * Sign In
       */

      navigate(
        '/login',
        {
          replace: true,
          state: {
            message:
              'Account created successfully. Please sign in.',
          },
        }
      );

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }
  }


  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="auth-screen">

      {/* ================================================== */}
      {/* SIGNUP PANEL */}
      {/* ================================================== */}

      <div className="auth-screen__panel">

        {/* Brand */}

        <div className="auth-brand">

          <span className="brand__mark brand__mark--lg">
            ◆
          </span>

          <div>

            <p className="auth-brand__name">
              Onchain Intelligence
            </p>

            <p className="auth-brand__sub">
              User registration
            </p>

          </div>

        </div>


        {/* Heading */}

        <div>

          <h1 className="auth-heading">
            Create account
          </h1>

          <p className="auth-copy">
            Create your User account first.
            After signup, you will be asked to sign in.
          </p>

        </div>


        {/* ================================================== */}
        {/* SIGNUP FORM */}
        {/* ================================================== */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* Full name */}

          <label className="field">

            <span className="field__label">
              Full name
            </span>

            <input
              className="field__input"
              type="text"
              value={form.name}
              onChange={(event) =>
                setField(
                  'name',
                  event.target.value
                )
              }
              placeholder="Enter your full name"
              autoFocus
              autoComplete="name"
            />

          </label>


          {/* Email */}

          <label className="field">

            <span className="field__label">
              Email
            </span>

            <input
              className="field__input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setField(
                  'email',
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
            />

          </label>


          {/* Password */}

          <label className="field">

            <span className="field__label">
              Password
            </span>

            <input
              className="field__input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setField(
                  'password',
                  event.target.value
                )
              }
              placeholder="Enter password"
              autoComplete="new-password"
            />

          </label>


          {/* Confirm password */}

          <label className="field">

            <span className="field__label">
              Confirm password
            </span>

            <input
              className="field__input"
              type="password"
              value={form.confirm}
              onChange={(event) =>
                setField(
                  'confirm',
                  event.target.value
                )
              }
              placeholder="Confirm password"
              autoComplete="new-password"
            />

          </label>


          {/* Error */}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}


          {/* Submit */}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading
              ? 'Creating…'
              : 'Sign up'}
          </button>

        </form>


        {/* ================================================== */}
        {/* LOGIN LINK */}
        {/* ================================================== */}

        <p className="auth-switch">

          Already registered?{' '}

          <Link
            className="link"
            to="/login"
          >
            Sign in
          </Link>

        </p>

      </div>


      {/* ================================================== */}
      {/* RIGHT SIDE */}
      {/* ================================================== */}

      <div className="auth-screen__side">

        <p className="auth-side__eyebrow">
          Two-stage workflow
        </p>

        <p className="auth-side__quote">
          Sign up → Sign in → Create unlimited wallets
          → Stage 1 → Stage 2 → Successful or Failed.
        </p>

      </div>

    </div>
  );
}