import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { stage2SubmitRequest } from "../lib/api";

/* =========================================================
   STAGE 2 FORM

   NEW FLOW

   - User adds ONE coin at a time
   - Every coin is saved immediately
   - Every saved coin goes to Manager 2
   - No Finish button
   - User can continue adding more coins
========================================================= */

export default function Stage2Form({
  wallet: walletProp,
  onSubmitted,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [coinName, setCoinName] =
    useState("");

  const [entryPrice, setEntryPrice] =
    useState("");

  const [peakPrice, setPeakPrice] =
    useState("");

  const [exitPrice, setExitPrice] =
    useState("");

  /* =======================================================
     SUBMITTED COINS
  ======================================================= */

  const [
    submittedCoins,
    setSubmittedCoins,
  ] = useState(
    Array.isArray(
      walletProp?.stage2Items
    )
      ? walletProp.stage2Items
      : []
  );

  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     USER STRATEGY

     ((Peak - Entry) / Entry) * 100
  ======================================================= */

  const userStrategy =
    useMemo(() => {
      const entry =
        Number(entryPrice);

      const peak =
        Number(peakPrice);

      if (
        !Number.isFinite(entry) ||
        entry <= 0 ||
        !Number.isFinite(peak)
      ) {
        return null;
      }

      return Number(
        (
          (
            (peak - entry) /
            entry
          ) * 100
        ).toFixed(2)
      );
    }, [
      entryPrice,
      peakPrice,
    ]);

  /* =======================================================
     TRADER STRATEGY

     ((Exit - Entry) / Entry) * 100
  ======================================================= */

  const traderStrategy =
    useMemo(() => {
      const entry =
        Number(entryPrice);

      const exit =
        Number(exitPrice);

      if (
        !Number.isFinite(entry) ||
        entry <= 0 ||
        !Number.isFinite(exit)
      ) {
        return null;
      }

      return Number(
        (
          (
            (exit - entry) /
            entry
          ) * 100
        ).toFixed(2)
      );
    }, [
      entryPrice,
      exitPrice,
    ]);

  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {
    setCoinName("");
    setEntryPrice("");
    setPeakPrice("");
    setExitPrice("");
    setErrorMessage("");
  }

  /* =======================================================
     SUBMIT ONE COIN
  ======================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    /* -----------------------------------------------------
       CLEAN VALUES
    ----------------------------------------------------- */

    const cleanCoinName =
      coinName.trim();

    const entry =
      Number(entryPrice);

    const peak =
      Number(peakPrice);

    const exit =
      Number(exitPrice);

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!cleanCoinName) {
      setErrorMessage(
        "Please enter the coin name."
      );

      return;
    }

    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      setErrorMessage(
        "Entry price must be greater than 0."
      );

      return;
    }

    if (
      !Number.isFinite(peak) ||
      peak < 0
    ) {
      setErrorMessage(
        "Please enter a valid peak price."
      );

      return;
    }

    if (
      !Number.isFinite(exit) ||
      exit < 0
    ) {
      setErrorMessage(
        "Please enter a valid exit price."
      );

      return;
    }

    /* -----------------------------------------------------
       API REQUEST
    ----------------------------------------------------- */

    try {
      setSubmitting(true);

      /*
       * IMPORTANT:
       *
       * Only ONE coin is sent in this request.
       *
       * Backend appends this coin to:
       *
       * wallet.stage2Items
       */

      const response =
        await stage2SubmitRequest(
          id,
          {
            coinName:
              cleanCoinName,

            entryPrice:
              entry,

            peakPrice:
              peak,

            exitPrice:
              exit,
          }
        );

      /* ---------------------------------------------------
         UPDATE SAVED COINS
      --------------------------------------------------- */

      const items =
        Array.isArray(
          response?.wallet
            ?.stage2Items
        )
          ? response.wallet
              .stage2Items
          : [];

      setSubmittedCoins(
        items
      );

      /* ---------------------------------------------------
         SUCCESS
      --------------------------------------------------- */

      setSuccessMessage(
        `${cleanCoinName} was saved successfully and sent to Manager 2 for review.`
      );

      /* ---------------------------------------------------
         RESET ONLY THE FORM
      --------------------------------------------------- */

      setCoinName("");
      setEntryPrice("");
      setPeakPrice("");
      setExitPrice("");

      setErrorMessage("");

      /* ---------------------------------------------------
         REFRESH PARENT WALLET
      --------------------------------------------------- */

      if (
        typeof onSubmitted ===
        "function"
      ) {
        await onSubmitted();
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Unable to submit Stage 2 details."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     STATUS CLASS
  ======================================================= */

  function statusClass(
    status
  ) {
    const value =
      String(
        status ||
          "Pending"
      ).toLowerCase();

    if (
      value ===
      "approved"
    ) {
      return "approved";
    }

    if (
      value ===
      "rejected"
    ) {
      return "rejected";
    }

    return "pending";
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="panel stage2-form-panel"
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="panel__header"
      >

        <div>

          <h2
            className="panel__title"
          >
            Stage 2 — Add Coin
          </h2>

          <p
            className="page__hint"
          >
            Add one coin at a time.
            Every submission is saved
            immediately and becomes
            available to Manager 2 for
            individual review.
          </p>

        </div>

        <span
          className="badge"
        >
          {
            submittedCoins.length
          }{" "}

          {
            submittedCoins.length ===
            1
              ? "COIN"
              : "COINS"
          }{" "}

          SAVED
        </span>

      </div>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {
        successMessage && (

          <div
            className="form-success"
          >
            ✓{" "}
            {successMessage}
          </div>

        )
      }


      {/* =================================================
          ERROR
      ================================================= */}

      {
        errorMessage && (

          <div
            className="form-error"
            role="alert"
          >
            {errorMessage}
          </div>

        )
      }


      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={
          handleSubmit
        }
      >

        <div
          className="form-grid"
        >

          {/* =============================================
              COIN NAME
          ============================================= */}

          <label
            className="field"
          >

            <span
              className="field__label"
            >
              Coin Name
            </span>

            <input
              className="field__input"
              value={
                coinName
              }
              onChange={(event) =>
                setCoinName(
                  event.target.value
                )
              }
              placeholder="Bitcoin"
              autoComplete="off"
            />

          </label>


          {/* =============================================
              ENTRY PRICE
          ============================================= */}

          <label
            className="field"
          >

            <span
              className="field__label"
            >
              Entry Price
            </span>

            <input
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={
                entryPrice
              }
              onChange={(event) =>
                setEntryPrice(
                  event.target.value
                )
              }
              placeholder="100"
            />

          </label>


          {/* =============================================
              PEAK PRICE
          ============================================= */}

          <label
            className="field"
          >

            <span
              className="field__label"
            >
              Peak Price
            </span>

            <input
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={
                peakPrice
              }
              onChange={(event) =>
                setPeakPrice(
                  event.target.value
                )
              }
              placeholder="150"
            />

          </label>


          {/* =============================================
              EXIT PRICE
          ============================================= */}

          <label
            className="field"
          >

            <span
              className="field__label"
            >
              Exit Price
            </span>

            <input
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={
                exitPrice
              }
              onChange={(event) =>
                setExitPrice(
                  event.target.value
                )
              }
              placeholder="120"
            />

          </label>

        </div>


        {/* =================================================
            STRATEGY PREVIEW
        ================================================= */}

        <div
          className="strategy-preview"
        >

          <div
            className="strategy-box"
          >

            <span>
              User Strategy
            </span>

            <strong>
              {
                userStrategy ===
                null
                  ? "—"
                  : `${userStrategy}%`
              }
            </strong>

          </div>


          <div
            className="strategy-box"
          >

            <span>
              Trader Strategy
            </span>

            <strong>
              {
                traderStrategy ===
                null
                  ? "—"
                  : `${traderStrategy}%`
              }
            </strong>

          </div>

        </div>


        {/* =================================================
            SUBMIT BUTTONS
        ================================================= */}

        <div
          className="form-submit-area"
        >

          <button
            className="submit-coin-btn"
            type="submit"
            disabled={
              submitting
            }
          >
            {
              submitting
                ? "Saving Coin..."
                : "Save Coin & Send for Review →"
            }
          </button>


          <button
            type="button"
            className="btn btn--secondary"
            disabled={
              submitting
            }
            onClick={() =>
              navigate(
                `/wallets/${id}`
              )
            }
          >
            Back to Wallet
          </button>

        </div>

      </form>


      {/* =================================================
          SUBMITTED COINS
      ================================================= */}

      {
        submittedCoins.length >
          0 && (

          <div
            className="stage2-saved-coins"
            style={{
              marginTop: 24,
            }}
          >

            <div
              className="panel__header"
              style={{
                marginBottom: 12,
              }}
            >

              <div>

                <h3
                  className="panel__title"
                >
                  Submitted Coins
                </h3>

                <p
                  className="page__hint"
                >
                  Each coin is reviewed
                  separately by Manager 2.
                </p>

              </div>

            </div>


            <div
              style={{
                display:
                  "grid",

                gap: 12,
              }}
            >

              {
                submittedCoins.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={
                        item._id ||
                        `${item.coinName}-${index}`
                      }
                      style={{
                        border:
                          "1px solid rgba(148,163,184,.22)",

                        borderRadius:
                          12,

                        padding:
                          16,
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap: 12,

                          flexWrap:
                            "wrap",
                        }}
                      >

                        <strong>
                          {
                            item.coinName ||
                            "Unnamed Coin"
                          }
                        </strong>


                        <span
                          className={
                            `stage2-item-status stage2-item-status--${statusClass(
                              item.status
                            )}`
                          }
                        >
                          {
                            item.status ||
                            "Pending"
                          }
                        </span>

                      </div>


                      <div
                        style={{
                          marginTop:
                            10,

                          display:
                            "flex",

                          gap: 18,

                          flexWrap:
                            "wrap",
                        }}
                      >

                        <span>
                          Entry:{" "}
                          <strong>
                            {
                              item.entryPrice ??
                              "—"
                            }
                          </strong>
                        </span>


                        <span>
                          Peak:{" "}
                          <strong>
                            {
                              item.peakPrice ??
                              "—"
                            }
                          </strong>
                        </span>


                        <span>
                          Exit:{" "}
                          <strong>
                            {
                              item.exitPrice ??
                              "—"
                            }
                          </strong>
                        </span>


                        <span>
                          User:{" "}
                          <strong>
                            {
                              item.userStrategyPL ??
                              item.userStrategy ??
                              "—"
                            }%
                          </strong>
                        </span>


                        <span>
                          Trader:{" "}
                          <strong>
                            {
                              item.traderStrategyPL ??
                              item.traderStrategy ??
                              "—"
                            }%
                          </strong>
                        </span>

                      </div>


                      {
                        item.reviewedByName && (

                          <div
                            style={{
                              marginTop:
                                10,

                              fontSize:
                                13,

                              opacity:
                                0.75,
                            }}
                          >

                            Reviewed by{" "}
                            {
                              item.reviewedByName
                            }

                            {
                              item.reviewNote
                                ? ` • ${item.reviewNote}`
                                : ""
                            }

                          </div>

                        )
                      }

                    </div>

                  )
                )
              }

            </div>

          </div>

        )
      }

    </section>
  );
}