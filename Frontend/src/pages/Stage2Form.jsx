import React, { useState } from "react";
import { useData } from "../lib/store";

export default function Stage2Form({
  wallet,
  onSubmitted,
}) {
  const {
    submitStage2,
  } = useData();

  const [
    form,
    setForm,
  ] = useState({
    coinName:
      wallet?.coinName || "",

    entryPrice:
      wallet?.entryPrice ?? "",

    peakPrice:
      wallet?.peakPrice ?? "",

    exitPrice:
      wallet?.exitPrice ?? "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  function setField(
    key,
    value
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );

    setError("");
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");


    /*
     * =====================================================
     * VALIDATION
     * =====================================================
     */

    if (
      !form.coinName.trim()
    ) {
      setError(
        "Coin Name is required."
      );

      return;
    }


    if (
      form.entryPrice === "" ||
      form.peakPrice === "" ||
      form.exitPrice === ""
    ) {
      setError(
        "Please enter Entry Price, Peak Price and Exit Price."
      );

      return;
    }


    const entry =
      Number(
        form.entryPrice
      );

    const peak =
      Number(
        form.peakPrice
      );

    const exit =
      Number(
        form.exitPrice
      );


    if (
      !Number.isFinite(
        entry
      ) ||
      entry <= 0
    ) {
      setError(
        "Entry Price must be greater than 0."
      );

      return;
    }


    if (
      !Number.isFinite(
        peak
      ) ||
      peak < 0
    ) {
      setError(
        "Peak Price must be a valid number."
      );

      return;
    }


    if (
      !Number.isFinite(
        exit
      ) ||
      exit < 0
    ) {
      setError(
        "Exit Price must be a valid number."
      );

      return;
    }


    /*
     * =====================================================
     * SUBMIT
     *
     * Backend calculates:
     *
     * User Strategy
     * ((Peak - Entry) / Entry) × 100
     *
     * Trader Strategy
     * ((Exit - Entry) / Entry) × 100
     * =====================================================
     */

    setLoading(true);


    try {
      await submitStage2(
        wallet.id,
        {
          coinName:
            form.coinName.trim(),

          entryPrice:
            entry,

          peakPrice:
            peak,

          exitPrice:
            exit,
        }
      );


      if (
        onSubmitted
      ) {
        onSubmitted();
      }

    } catch (
      err
    ) {
      setError(
        err?.message ||
        "Unable to submit Stage 2 details."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="stage2-form-card">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="stage2-form-header">

        <div>

          <span className="stage2-form-eyebrow">
            STAGE 2
          </span>

          <h3>
            Enter trading strategy details
          </h3>

          <p>
            Enter Coin Name, Entry Price,
            Peak Price and Exit Price.
            User Strategy and Trader Strategy
            will be calculated automatically.
          </p>

        </div>


        <span className="stage2-form-status">
          Stage 2 Required
        </span>

      </div>


      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="stage2-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================================
            COIN NAME
        ================================================= */}

        <label className="stage2-field">

          <span>
            Coin Name *
          </span>

          <input
            type="text"
            value={
              form.coinName
            }
            onChange={(event) =>
              setField(
                "coinName",
                event.target.value
              )
            }
            placeholder="e.g. Bitcoin"
            autoComplete="off"
          />

        </label>


        {/* =================================================
            ENTRY PRICE
        ================================================= */}

        <label className="stage2-field">

          <span>
            Entry Price *
          </span>

          <input
            type="number"
            min="0.00000001"
            step="0.01"
            value={
              form.entryPrice
            }
            onChange={(event) =>
              setField(
                "entryPrice",
                event.target.value
              )
            }
            placeholder="Enter entry price"
          />

        </label>


        {/* =================================================
            PEAK PRICE
        ================================================= */}

        <label className="stage2-field">

          <span>
            Peak Price *
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              form.peakPrice
            }
            onChange={(event) =>
              setField(
                "peakPrice",
                event.target.value
              )
            }
            placeholder="Enter peak price"
          />

        </label>


        {/* =================================================
            EXIT PRICE
        ================================================= */}

        <label className="stage2-field">

          <span>
            Exit Price *
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              form.exitPrice
            }
            onChange={(event) =>
              setField(
                "exitPrice",
                event.target.value
              )
            }
            placeholder="Enter exit price"
          />

        </label>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="stage2-form-error"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="stage2-form-actions">

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Submit for Stage 2 Approval"}
          </button>

        </div>

      </form>

    </div>
  );
}