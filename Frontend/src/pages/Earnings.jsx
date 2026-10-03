import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../lib/store";

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function tierClass(key) {
  return `tier-chip tier-chip--${key}`;
}

export default function Earnings() {
  const { currentUser, getEarnings, addEarning } = useData();

  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await getEarnings();
      setData(response);

      if (response?.isAdmin && !selectedUser && response.users?.length) {
        setSelectedUser(response.users[0].id);
      }
    } catch (err) {
      setError(err?.message || "Unable to load earnings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const currentUserData = data?.user || null;
  const adminUsers = data?.users || [];

  const selectedUserData = useMemo(
    () => adminUsers.find((user) => user.id === selectedUser),
    [adminUsers, selectedUser]
  );

  async function handleAddEarning(event) {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!selectedUser) {
      setError("Select a user.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setError("Enter a valid non-negative earning amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await addEarning({
        userId: selectedUser,
        amount: numericAmount,
        note: note.trim(),
        paidAt: paidAt || undefined,
      });

      setAmount("");
      setNote("");
      setPaidAt("");
      setMessage("Earning/payment detail added successfully.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to add earning.");
    } finally {
      setSaving(false);
    }
  }

  const profile = currentUser?.role === "admin" ? selectedUserData : currentUserData;
  const tiers = data?.tiers || [];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">EARNINGS & SUCCESS TIERS</p>
          <h1 className="page__title">Earnings & Tier Progress</h1>
          <p className="page__subtitle">
            Earnings are entered by Admin. Tier progress is calculated from successful wallets only.
          </p>
        </div>
        <span className="badge">{currentUser?.role === "admin" ? "ADMIN" : "MY EARNINGS"}</span>
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      {currentUser?.role === "admin" && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Add user earning / paid detail</h2>
              <p className="page__hint">Only Admin can create earning records.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleAddEarning}>
            <label>
              User
              <select
                className="field__input"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
                required
              >
                <option value="">Select user</option>
                {adminUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Earning / paid amount (₹)
              <input
                className="field__input"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 25000"
                required
              />
            </label>

            <label>
              Paid date
              <input
                className="field__input"
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
              />
            </label>

            <label>
              Note
              <input
                className="field__input"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Monthly earning, bonus, payout..."
              />
            </label>

            <div className="action-block__buttons">
              <button className="btn btn--success" type="submit" disabled={saving || !adminUsers.length}>
                {saving ? "Saving…" : "Add earning"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <section className="panel"><p>Loading earnings…</p></section>
      ) : (
        <>
          <section className="lb-stats-grid">
            <article className="lb-stat lb-stat--green">
              <div className="lb-stat__top">
                <span className="lb-stat__label">Total earnings</span>
                <span className="lb-stat__icon">₹</span>
              </div>
              <strong className="lb-stat__value">{formatMoney(profile?.totalEarnings)}</strong>
            </article>

            <article className="lb-stat lb-stat--blue">
              <div className="lb-stat__top">
                <span className="lb-stat__label">Successful wallets</span>
                <span className="lb-stat__icon">✓</span>
              </div>
              <strong className="lb-stat__value">{profile?.successfulWallets ?? 0}</strong>
            </article>

            <article className="lb-stat lb-stat--violet">
              <div className="lb-stat__top">
                <span className="lb-stat__label">Current tier</span>
                <span className="lb-stat__icon">◆</span>
              </div>
              <strong className="lb-stat__value">{profile?.tier?.label || "Silver 1"}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2 className="panel__title">Success tier ladder</h2>
                <p className="page__hint">Your tier is determined by successful wallets.</p>
              </div>
              <span className={tierClass(profile?.tier?.key || "silver1")}>
                {profile?.tier?.label || "Silver 1"}
              </span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Successful wallets</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => {
                    const active = tier.key === profile?.tier?.key;
                    const range = tier.max == null
                      ? `${tier.min}+`
                      : `${tier.min}–${tier.max}`;
                    return (
                      <tr key={tier.key}>
                        <td><span className={tierClass(tier.key)}>{tier.label}</span></td>
                        <td>{range}</td>
                        <td>{active ? <strong>Current tier</strong> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2 className="panel__title">
                  {currentUser?.role === "admin" ? "User earning overview" : "My earning history"}
                </h2>
              </div>
            </div>

            {currentUser?.role === "admin" ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Successful wallets</th>
                      <th>Tier</th>
                      <th>Total earnings</th>
                      <th>Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          <div className="table-sub">{user.email}</div>
                        </td>
                        <td>{user.successfulWallets}</td>
                        <td><span className={tierClass(user.tier.key)}>{user.tier.label}</span></td>
                        <td className="cell--success">{formatMoney(user.totalEarnings)}</td>
                        <td>{user.earnings?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Note</th>
                      <th>Added by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentUserData?.earnings || []).slice().reverse().map((item, index) => (
                      <tr key={item._id || index}>
                        <td>{item.paidAt ? new Date(item.paidAt).toLocaleDateString() : "—"}</td>
                        <td className="cell--success">{formatMoney(item.amount)}</td>
                        <td>{item.note || "—"}</td>
                        <td>{item.addedByName || "Admin"}</td>
                      </tr>
                    ))}
                    {!currentUserData?.earnings?.length && (
                      <tr><td colSpan="4" className="empty-row">No earning/payment details have been added yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
