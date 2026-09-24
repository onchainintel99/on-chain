import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../lib/store';

export default function AddWallet() {
  const { createWallet } = useData();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    coinName: '',
    tradeId: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Update form fields
  const setField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Submit wallet
  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    // Validation
    if (!form.coinName.trim() || !form.tradeId.trim()) {
      setError('Coin name and trade ID are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await createWallet(form);

      // Open newly created wallet
      navigate(`/wallets/${response.wallet.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">

      {/* Back button */}
      <Link
        to="/"
        className="link link--back"
      >
        ← Back to dashboard
      </Link>


      {/* Page header */}
      <div className="page__header">

        <div>

          <h1 className="page__title">
            Create a wallet request
          </h1>

          <p className="page__subtitle">
            Submit the coin name and trade ID.
            This starts Manager Stage 1 review.
          </p>

        </div>

      </div>


      {/* Wallet form */}
      <form
        className="panel form"
        onSubmit={handleSubmit}
      >

        {/* Coin name */}
        <label className="field">

          <span className="field__label">
            Coin name *
          </span>

          <input
            className="field__input"
            type="text"
            value={form.coinName}
            onChange={(event) =>
              setField(
                'coinName',
                event.target.value
              )
            }
            placeholder="e.g. Bitcoin"
            autoFocus
          />

        </label>


        {/* Trade ID */}
        <label className="field">

          <span className="field__label">
            Trade ID *
          </span>

          <input
            className="field__input field__input--mono"
            type="text"
            value={form.tradeId}
            onChange={(event) =>
              setField(
                'tradeId',
                event.target.value
              )
            }
            placeholder="Enter trade ID"
          />

        </label>


        {/* Notes */}
        <label className="field">

          <span className="field__label">
            Notes (optional)
          </span>

          <textarea
            className="field__input field__textarea"
            rows="4"
            value={form.notes}
            onChange={(event) =>
              setField(
                'notes',
                event.target.value
              )
            }
            placeholder="Any additional context"
          />

        </label>


        {/* Error */}
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}


        {/* Submit */}
        <div className="form__actions">

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading
              ? 'Submitting…'
              : 'Submit for Stage 1'}
          </button>

        </div>

      </form>

    </div>
  );
}