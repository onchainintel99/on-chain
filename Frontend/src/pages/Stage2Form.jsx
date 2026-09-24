import React, { useState } from 'react';
import { useData } from '../lib/store';

export default function Stage2Form({ wallet, onSubmitted }) {
  const { updateWalletStage2 } = useData();

  const [form, setForm] = useState({
    coinName: wallet?.coinName || '',
    tradeDetails: wallet?.tradeId || '',
    costPrice: wallet?.costPrice || '',
    soldPrice: wallet?.soldPrice || '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (
      !form.coinName.trim() ||
      !form.tradeDetails.trim() ||
      !form.costPrice ||
      !form.soldPrice
    ) {
      setError('Please fill all fields.');
      return;
    }

    if (
      Number(form.costPrice) < 0 ||
      Number(form.soldPrice) < 0
    ) {
      setError('CP and SP cannot be negative.');
      return;
    }

    setLoading(true);

    try {
      await updateWalletStage2(wallet.id, {
        coinName: form.coinName.trim(),
        tradeId: form.tradeDetails.trim(),
        costPrice: Number(form.costPrice),
        soldPrice: Number(form.soldPrice),
      });

      if (onSubmitted) {
        onSubmitted();
      }

    } catch (err) {
      setError(
        err.message || 'Unable to submit Stage 2 details.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stage2-form-card">

      {/* Header */}

      <div className="stage2-form-header">

        <div>
          <span className="stage2-form-eyebrow">
            STAGE 2
          </span>

          <h3>
            Enter trade details
          </h3>

          <p>
            Stage 1 has been approved. Enter the
            pricing information required for Stage 2.
          </p>
        </div>

        <span className="stage2-form-status">
          Stage 2 Required
        </span>

      </div>


      {/* Form */}

      <form
        className="stage2-form"
        onSubmit={handleSubmit}
      >

        {/* Coin Name */}

        <label className="stage2-field">

          <span>
            Coin Name
          </span>

          <input
            type="text"
            value={form.coinName}
            onChange={(event) =>
              setField(
                'coinName',
                event.target.value
              )
            }
            placeholder="e.g. Bitcoin"
          />

        </label>


        {/* Trade Details */}

        <label className="stage2-field">

          <span>
            Trade Details / Trade ID
          </span>

          <input
            type="text"
            value={form.tradeDetails}
            onChange={(event) =>
              setField(
                'tradeDetails',
                event.target.value
              )
            }
            placeholder="Enter trade ID or trade details"
          />

        </label>


        {/* Cost Price */}

        <label className="stage2-field">

          <span>
            Cost Price (CP)
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={(event) =>
              setField(
                'costPrice',
                event.target.value
              )
            }
            placeholder="Enter cost price"
          />

        </label>


        {/* Sold Price */}

        <label className="stage2-field">

          <span>
            Sold Price (SP)
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.soldPrice}
            onChange={(event) =>
              setField(
                'soldPrice',
                event.target.value
              )
            }
            placeholder="Enter sold price"
          />

        </label>


        {/* Error */}

        {error && (
          <p className="stage2-form-error">
            {error}
          </p>
        )}


        {/* Submit */}

        <div className="stage2-form-actions">

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading
              ? 'Submitting...'
              : 'Submit for Stage 2 Approval'}
          </button>

        </div>

      </form>

    </div>
  );
}