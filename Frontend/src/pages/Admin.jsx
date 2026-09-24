import React, { useEffect, useState } from 'react';
import { useData } from '../lib/store';
import StatCard from '../components/StatCard';

const ROLE_LABELS = {
  user: 'User',
  manager1: 'Manager Stage 1',
  manager2: 'Manager Stage 2',
  admin: 'Admin',
};

export default function Admin() {
  const {
    getAdminOverview,
    createStaff,
  } = useData();

  const [data, setData] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager1',
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  /*
   * Load admin dashboard
   */
  async function load() {
    try {
      const response = await getAdminOverview();

      /*
       * IMPORTANT:
       * Only keep normal registered users.
       *
       * Managers and admins will not appear
       * in the Users and Wallet Statistics table.
       */
      const normalUsers = (response.users || []).filter(
        (user) => user.role === 'user'
      );

      setData({
        ...response,
        users: normalUsers,
      });
    } catch (e) {
      setError(e.message);
    }
  }

  /*
   * Initial load + refresh every 5 seconds
   */
  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Create Manager/Admin account
   */
  async function submit(e) {
    e.preventDefault();

    setError('');
    setMessage('');

    /*
     * Basic validation
     */
    if (!form.name.trim()) {
      setError('Please enter a name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter an email.');
      return;
    }

    if (!form.password) {
      setError('Please enter a password.');
      return;
    }

    if (form.password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      );
      return;
    }

    try {
      await createStaff(form);

      setMessage(
        `${ROLE_LABELS[form.role]} account created successfully.`
      );

      /*
       * Reset form
       */
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'manager1',
      });

      /*
       * Refresh dashboard
       */
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  /*
   * Loading state
   */
  if (!data) {
    return (
      <div className="empty-state">
        Loading admin dashboard…
      </div>
    );
  }

  const overview = data.overview || {};

  /*
   * Only normal users should appear here.
   *
   * Extra safety filter in case the backend
   * returns staff accounts.
   */
  const users = (data.users || []).filter(
    (user) => user.role === 'user'
  );

  return (
    <div className="page">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="page__header">

        <div>

          <h1 className="page__title">
            Admin dashboard
          </h1>

          <p className="page__subtitle">
            Monitor users, wallets, approval stages,
            successful wallets and failed wallets.
          </p>

        </div>

      </div>


      {/* ===================================================== */}
      {/* STATISTICS */}
      {/* ===================================================== */}

      <section className="stat-grid">

        <StatCard
          label="All users"
          value={overview.totalUsers ?? users.length}
        />

        <StatCard
          label="Users who logged in"
          value={overview.loggedUsers ?? 0}
          accent="violet"
        />

        <StatCard
          label="Wallets created"
          value={overview.totalWallets ?? 0}
        />

        <StatCard
          label="Passed Stage 1"
          value={overview.passedStage1 ?? 0}
          accent="gold"
        />

        <StatCard
          label="Passed Stage 2"
          value={overview.passedStage2 ?? 0}
          accent="teal"
        />

        <StatCard
          label="Successful"
          value={overview.successful ?? 0}
          accent="teal"
        />

        <StatCard
          label="Failed"
          value={overview.failed ?? 0}
          accent="red"
        />

        <StatCard
          label="Waiting Stage 1"
          value={overview.stage1 ?? 0}
          accent="gold"
        />

      </section>


      {/* ===================================================== */}
      {/* CREATE MANAGER / ADMIN ACCOUNT */}
      {/* ===================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Create manager/admin account
          </h2>

        </div>


        <form
          className="form form--inline"
          onSubmit={submit}
        >

          {/* NAME */}

          <label className="field">

            <span className="field__label">
              Name
            </span>

            <input
              className="field__input"
              type="text"
              placeholder="Enter name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

          </label>


          {/* EMAIL */}

          <label className="field">

            <span className="field__label">
              Email
            </span>

            <input
              className="field__input"
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

          </label>


          {/* PASSWORD */}

          <label className="field">

            <span className="field__label">
              Password
            </span>

            <input
              className="field__input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
            />

          </label>


          {/* ROLE */}

          <label className="field">

            <span className="field__label">
              Role
            </span>

            <select
              className="field__input"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >

              <option value="manager1">
                Manager Stage 1
              </option>

              <option value="manager2">
                Manager Stage 2
              </option>

              <option value="admin">
                Admin
              </option>

            </select>

          </label>


          {/* SUBMIT */}

          <button
            type="submit"
            className="btn btn--primary"
          >
            Create account
          </button>

        </form>


        {/* SUCCESS */}

        {message && (
          <p className="form-success">
            {message}
          </p>
        )}


        {/* ERROR */}

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

      </section>


      {/* ===================================================== */}
      {/* NORMAL USERS ONLY */}
      {/* ===================================================== */}

      <section className="panel">

        <div className="panel__header">

          <div>

            <h2 className="panel__title">
              Users and wallet statistics
            </h2>

            <p className="page__hint">
              Only registered normal users are shown here.
              Manager and Admin accounts are hidden.
            </p>

          </div>

          <span className="panel__count">
            {users.length} users
          </span>

        </div>


        <div className="table-wrap">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Role
                </th>

                <th>
                  Created wallets
                </th>

                <th>
                  Passed Stage 1
                </th>

                <th>
                  Passed Stage 2
                </th>

                <th>
                  Successful
                </th>

                <th>
                  Failed
                </th>

                <th>
                  Last login
                </th>

              </tr>

            </thead>


            <tbody>

              {users.map((user) => (

                <tr key={user.id}>

                  {/* USER */}

                  <td>

                    <strong>
                      {user.name}
                    </strong>

                    <div className="table-sub">
                      {user.email}
                      {' · '}
                      {user.loginCount || 0}
                      {' '}
                      {user.loginCount === 1
                        ? 'login'
                        : 'logins'}
                    </div>

                  </td>


                  {/* ROLE */}

                  <td>
                    <span className="badge">
                      {ROLE_LABELS[user.role] || 'User'}
                    </span>
                  </td>


                  {/* CREATED */}

                  <td>
                    {user.created ?? 0}
                  </td>


                  {/* PASSED STAGE 1 */}

                  <td>
                    {user.passedStage1 ?? 0}
                  </td>


                  {/* PASSED STAGE 2 */}

                  <td>
                    {user.passedStage2 ?? 0}
                  </td>


                  {/* SUCCESSFUL */}

                  <td className="cell--success">
                    {user.successful ?? 0}
                  </td>


                  {/* FAILED */}

                  <td className="cell--danger">
                    {user.failed ?? 0}
                  </td>


                  {/* LAST LOGIN */}

                  <td>

                    {user.lastLoginAt
                      ? new Date(
                          user.lastLoginAt
                        ).toLocaleString()
                      : 'Never'}

                  </td>

                </tr>

              ))}


              {/* NO USERS */}

              {!users.length && (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-row"
                  >

                    No normal users have registered yet.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}