import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useData,
} from "../lib/store";

import Badge from "../components/Badge";

import {
  formatDateTime,
} from "../lib/utils";


/* =========================================================
   HISTORY LABELS
========================================================= */

const LABELS = {
  created:
    "Wallet created",

  stage1_approved:
    "Stage 1 approved",

  stage1_rejected:
    "Stage 1 rejected",

  stage2_submitted:
    "Stage 2 details submitted",

  stage2_approved:
    "Stage 2 approved",

  stage2_rejected:
    "Stage 2 rejected",

  stage3_approved:
    "Final Stage 3 approved",

  stage3_rejected:
    "Stage 3 rejected",

  note:
    "Note",
};


/* =========================================================
   HELPERS
========================================================= */

function getId(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    value._id
  ) {
    return String(value._id);
  }

  if (
    value.id
  ) {
    return String(value.id);
  }

  return "";
}


function getDisplayName(
  value
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return (
    value.name ||
    value.email ||
    value.username ||
    ""
  );
}


function formatPercentage(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "—";
  }

  return `${
    number >= 0
      ? "+"
      : ""
  }${number.toFixed(2)}%`;
}


function strategyClass(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return Number(value) >= 0
    ? "strategy-positive"
    : "strategy-negative";
}


/* =========================================================
   COMPONENT
========================================================= */

export default function WalletDetail() {
  const {
    id,
  } = useParams();


  const {
    getWallet,
    stage1Decision,
    submitStage2,
    stage2Decision,
    stage3Decision,
    currentUser,
  } = useData();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    wallet,
    setWallet,
  ] = useState(null);


  const [
    note,
    setNote,
  ] = useState("");


  const [
    stage2CoinName,
    setStage2CoinName,
  ] = useState("");


  const [
    entryPrice,
    setEntryPrice,
  ] = useState("");


  const [
    peakPrice,
    setPeakPrice,
  ] = useState("");


  const [
    exitPrice,
    setExitPrice,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* =======================================================
     LOAD WALLET
  ======================================================= */

  async function loadWallet() {
    try {
      setError("");

      const response =
        await getWallet(id);


      const loadedWallet =
        response?.wallet;


      setWallet(
        loadedWallet
      );


      /*
       * If Stage 2 data already exists,
       * populate the form with it.
       */

      if (
        loadedWallet
      ) {
        setStage2CoinName(
          loadedWallet.coinName ||
          ""
        );

        setEntryPrice(
          loadedWallet.entryPrice ??
          ""
        );

        setPeakPrice(
          loadedWallet.peakPrice ??
          ""
        );

        setExitPrice(
          loadedWallet.exitPrice ??
          ""
        );
      }

    } catch (err) {
      setError(
        err?.message ||
        "Unable to load wallet."
      );
    }
  }


  useEffect(() => {
    loadWallet();
  }, [id]);


  /* =======================================================
     CURRENT ROLE
  ======================================================= */

  const role =
    currentUser?.role;


  const canApprove =
    [
      "manager1",
      "manager2",
      "admin",
    ].includes(
      role
    );


  const isAdmin =
    role === "admin";


  /* =======================================================
     OWNER CHECK
  ======================================================= */

  const walletOwnerId =
    getId(
      wallet?.userId
    );


  const currentUserId =
    getId(
      currentUser?._id ||
      currentUser?.id
    );


  const isOwner =
    walletOwnerId !== "" &&
    currentUserId !== "" &&
    walletOwnerId ===
      currentUserId;


  /* =======================================================
     STAGE CONDITIONS
  ======================================================= */

  /*
   * Normal user who created the wallet
   * can enter Stage 2 details.
   */

  const showStage2Form =
    role === "user" &&
    isOwner &&
    wallet?.status ===
      "Pending Stage 2";


  /*
   * Manager 1 / Manager 2 / Admin
   * can approve Stage 1.
   */

  const showStage1Actions =
    canApprove &&
    wallet?.status ===
      "Pending Stage 1";


  /*
   * Stage 2 approval becomes available
   * only after Stage 2 details are submitted.
   */

  const hasStage2Data =
    Boolean(
      wallet?.coinName
    ) &&
    wallet?.entryPrice !==
      null &&
    wallet?.entryPrice !==
      undefined &&
    wallet?.peakPrice !==
      null &&
    wallet?.peakPrice !==
      undefined &&
    wallet?.exitPrice !==
      null &&
    wallet?.exitPrice !==
      undefined;


  const showStage2Actions =
    canApprove &&
    wallet?.status ===
      "Pending Stage 2" &&
    hasStage2Data;


  /*
   * Only Admin gets Stage 3 final approval.
   */

  const showStage3Actions =
    isAdmin &&
    wallet?.status ===
      "Pending Stage 3";


  /* =======================================================
     CALCULATED STRATEGIES
  ======================================================= */

  const liveStrategies =
    useMemo(() => {
      const entry =
        Number(entryPrice);

      const peak =
        Number(peakPrice);

      const exit =
        Number(exitPrice);


      if (
        !Number.isFinite(entry) ||
        entry <= 0
      ) {
        return {
          userStrategy: null,
          traderStrategy: null,
        };
      }


      return {
        userStrategy:
          Number(
            (
              (
                (peak - entry) /
                entry
              ) *
              100
            ).toFixed(2)
          ),

        traderStrategy:
          Number(
            (
              (
                (exit - entry) /
                entry
              ) *
              100
            ).toFixed(2)
          ),
      };
    }, [
      entryPrice,
      peakPrice,
      exitPrice,
    ]);


  /* =======================================================
     EXISTING STRATEGIES
  ======================================================= */

  const userStrategy =
    wallet?.userStrategy ??
    wallet?.userStrategyPL ??
    null;


  const traderStrategy =
    wallet?.traderStrategy ??
    wallet?.traderStrategyPL ??
    null;


  /* =======================================================
     CREATED BY
  ======================================================= */

  const creatorName =
    getDisplayName(
      wallet?.userId
    ) ||
    wallet?.userName ||
    wallet?.createdBy ||
    (
      isOwner
        ? currentUser?.name
        : ""
    ) ||
    "—";


  /* =======================================================
     REVIEWER NAMES
  ======================================================= */

  const stage1Reviewer =
    getDisplayName(
      wallet?.stage1ReviewedBy
    ) ||
    wallet?.stage1ReviewedByName ||
    "Pending";


  const stage2Reviewer =
    getDisplayName(
      wallet?.stage2ReviewedBy
    ) ||
    wallet?.stage2ReviewedByName ||
    "Pending";


  const stage3Reviewer =
    getDisplayName(
      wallet?.stage3ReviewedBy
    ) ||
    wallet?.stage3ReviewedByName ||
    "Pending";


  /* =======================================================
     STAGE 1 DECISION
  ======================================================= */

  async function handleStage1(
    decision
  ) {
    setError("");
    setLoading(true);


    try {
      const response =
        await stage1Decision(
          id,
          {
            decision,
            note,
          }
        );


      setWallet(
        response.wallet
      );

      setNote("");

    } catch (err) {
      setError(
        err?.message ||
        "Unable to process Stage 1."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     STAGE 2 SUBMIT
  ======================================================= */

  async function handleStage2Submit(
    event
  ) {
    event.preventDefault();

    setError("");


    if (
      !stage2CoinName.trim()
    ) {
      setError(
        "Coin Name is required."
      );

      return;
    }


    if (
      entryPrice === "" ||
      peakPrice === "" ||
      exitPrice === ""
    ) {
      setError(
        "Entry Price, Peak Price and Exit Price are required."
      );

      return;
    }


    const entry =
      Number(entryPrice);

    const peak =
      Number(peakPrice);

    const exit =
      Number(exitPrice);


    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      setError(
        "Entry Price must be greater than 0."
      );

      return;
    }


    if (
      !Number.isFinite(peak) ||
      peak < 0
    ) {
      setError(
        "Peak Price must be a valid non-negative number."
      );

      return;
    }


    if (
      !Number.isFinite(exit) ||
      exit < 0
    ) {
      setError(
        "Exit Price must be a valid non-negative number."
      );

      return;
    }


    const calculatedUserStrategy =
      Number(
        (
          (
            (peak - entry) /
            entry
          ) *
          100
        ).toFixed(2)
      );


    const calculatedTraderStrategy =
      Number(
        (
          (
            (exit - entry) /
            entry
          ) *
          100
        ).toFixed(2)
      );


    setLoading(true);


    try {
      const response =
        await submitStage2(
          id,
          {
            coinName:
              stage2CoinName.trim(),

            entryPrice:
              entry,

            peakPrice:
              peak,

            exitPrice:
              exit,

            userStrategy:
              calculatedUserStrategy,

            traderStrategy:
              calculatedTraderStrategy,

            userStrategyPL:
              calculatedUserStrategy,

            traderStrategyPL:
              calculatedTraderStrategy,
          }
        );


      setWallet(
        response.wallet
      );


      setStage2CoinName(
        response.wallet?.coinName ||
        stage2CoinName.trim()
      );


      setEntryPrice(
        response.wallet?.entryPrice ??
        entry
      );


      setPeakPrice(
        response.wallet?.peakPrice ??
        peak
      );


      setExitPrice(
        response.wallet?.exitPrice ??
        exit
      );


      setError("");

    } catch (err) {
      setError(
        err?.message ||
        "Unable to submit Stage 2 details."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     STAGE 2 DECISION
  ======================================================= */

  async function handleStage2(
    decision
  ) {
    setError("");
    setLoading(true);


    try {
      const response =
        await stage2Decision(
          id,
          {
            decision,
            note,
          }
        );


      setWallet(
        response.wallet
      );

      setNote("");

    } catch (err) {
      setError(
        err?.message ||
        "Unable to process Stage 2."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     STAGE 3 DECISION
  ======================================================= */

  async function handleStage3(
    decision
  ) {
    setError("");
    setLoading(true);


    try {
      const response =
        await stage3Decision(
          id,
          {
            decision,
            note,
          }
        );


      setWallet(
        response.wallet
      );

      setNote("");

    } catch (err) {
      setError(
        err?.message ||
        "Unable to process Stage 3."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (!wallet) {
    return (
      <div className="page">

        <Link
          to="/wallets"
          className="link link--back"
        >
          ← Back to wallets
        </Link>


        <div className="panel">

          <p>
            {error ||
              "Loading wallet..."}
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="page">

      {/* ===================================================
          BACK
      =================================================== */}

      <Link
        to="/wallets"
        className="link link--back"
      >
        ← Back to wallets
      </Link>


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="page__header">

        <div>

          <p className="page__eyebrow">
            WALLET DETAILS
          </p>

          <h1 className="page__title">
            Wallet Details
          </h1>

          <p className="page__subtitle">

            Trade ID:{" "}

            <span className="mono-cell">
              {wallet.tradeId ||
                "—"}
            </span>

            {" · "}

            Created by{" "}

            <strong>
              {creatorName}
            </strong>

          </p>

        </div>


        <Badge
          status={
            wallet.status
          }
        />

      </div>


      {/* ===================================================
          APPROVAL PIPELINE
      =================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Approval Pipeline
          </h2>

        </div>


        <div className="pipeline">

          {[
            {
              number: 1,
              label: "Stage 1",
            },

            {
              number: 2,
              label: "Stage 2",
            },

            {
              number: 3,
              label: "Stage 3",
            },

            {
              number: 4,
              label: "Successful",
            },
          ].map(
            (
              item,
              index,
              array
            ) => {

              const active =
                item.number <=
                  (wallet.stage || 1) ||
                (
                  item.number === 4 &&
                  wallet.status ===
                    "Successful"
                );


              return (
                <React.Fragment
                  key={
                    item.number
                  }
                >

                  <div
                    className={`pipeline-step ${
                      active
                        ? "pipeline-step--active"
                        : ""
                    }`}
                  >

                    <div className="pipeline-step__number">
                      {item.number}
                    </div>

                    <div className="pipeline-step__content">

                      <strong>
                        {item.label}
                      </strong>

                    </div>

                  </div>


                  {index <
                    array.length - 1 && (
                    <div className="pipeline-arrow">
                      →
                    </div>
                  )}

                </React.Fragment>
              );
            }
          )}

        </div>

      </section>


      {/* ===================================================
          WALLET INFORMATION
      =================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Wallet information
          </h2>

        </div>


        <dl className="detail-list">

          {/* Trade ID */}

          <div className="detail-list__row">

            <dt>
              Trade ID
            </dt>

            <dd className="mono-cell">
              {wallet.tradeId ||
                "—"}
            </dd>

          </div>


          {/* Created By */}

          <div className="detail-list__row">

            <dt>
              Created By
            </dt>

            <dd>
              {creatorName}
            </dd>

          </div>


          {/* Current Stage */}

          <div className="detail-list__row">

            <dt>
              Current Stage
            </dt>

            <dd>
              Stage{" "}
              {wallet.stage ||
                1}
            </dd>

          </div>


          {/* Stage 1 Approved */}

          <div className="detail-list__row">

            <dt>
              Stage 1 Approved By
            </dt>

            <dd>
              {stage1Reviewer}
            </dd>

          </div>


          {/* Stage 2 Approved */}

          <div className="detail-list__row">

            <dt>
              Stage 2 Approved By
            </dt>

            <dd>
              {stage2Reviewer}
            </dd>

          </div>


          {/* Final Admin Approved */}

          <div className="detail-list__row">

            <dt>
              Final Admin Approved By
            </dt>

            <dd>
              {stage3Reviewer}
            </dd>

          </div>

        </dl>


        {/* =================================================
            STAGE 2 DATA TABLE

            Stage 1 does NOT show these fields.
        ================================================= */}

        {hasStage2Data && (

          <div className="stage2-details-table-section">

            <div className="stage2-details-table-title">
              Stage 2 Trade Details
            </div>


            <div className="table-wrap">

              <table className="data-table stage2-trade-table">

                <thead>

                  <tr>

                    <th>
                      Coin Name
                    </th>

                    <th>
                      Entry Price
                    </th>

                    <th>
                      Peak Price
                    </th>

                    <th>
                      Exit Price
                    </th>

                    <th>
                      User Strategy
                    </th>

                    <th>
                      Trader Strategy
                    </th>

                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>
                      {wallet.coinName ||
                        "—"}
                    </td>


                    <td>
                      {wallet.entryPrice !=
                      null
                        ? wallet.entryPrice
                        : "—"}
                    </td>


                    <td>
                      {wallet.peakPrice !=
                      null
                        ? wallet.peakPrice
                        : "—"}
                    </td>


                    <td>
                      {wallet.exitPrice !=
                      null
                        ? wallet.exitPrice
                        : "—"}
                    </td>


                    <td>

                      <span
                        className={
                          strategyClass(
                            userStrategy
                          )
                        }
                      >
                        {formatPercentage(
                          userStrategy
                        )}
                      </span>

                    </td>


                    <td>

                      <span
                        className={
                          strategyClass(
                            traderStrategy
                          )
                        }
                      >
                        {formatPercentage(
                          traderStrategy
                        )}
                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        )}

      </section>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div
          className="form-error"
          role="alert"
        >
          {error}
        </div>

      )}


      {/* ===================================================
          STAGE 1 APPROVAL
      =================================================== */}

      {showStage1Actions && (

        <section className="panel">

          <div className="panel__header">

            <div>

              <h2 className="panel__title">
                Stage 1 Approval
              </h2>

              <p className="page__hint">
                Manager 1, Manager 2 and
                Admin can approve or reject
                this wallet.
              </p>

            </div>

          </div>


          <textarea
            className="field__input field__textarea"
            rows="3"
            placeholder="Optional approval note"
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value
              )
            }
          />


          <div className="action-block__buttons">

            <button
              type="button"
              className="btn btn--success"
              disabled={loading}
              onClick={() =>
                handleStage1(
                  "approve"
                )
              }
            >
              ✓ Approve Stage 1
            </button>


            <button
              type="button"
              className="btn btn--danger"
              disabled={loading}
              onClick={() =>
                handleStage1(
                  "reject"
                )
              }
            >
              ✕ Reject Stage 1
            </button>

          </div>

        </section>

      )}


      {/* ===================================================
          STAGE 2 USER FORM
      =================================================== */}

      {showStage2Form && (

        <section className="stage2-details-card">

          <div className="stage2-details-header">

            <div>

              <span className="stage2-form-eyebrow">
                STAGE 2
              </span>

              <h2>
                Enter trading strategy details
              </h2>

              <p>
                Enter Coin Name, Entry Price,
                Peak Price and Exit Price.
                User Strategy and Trader Strategy
                will be calculated automatically.
              </p>

            </div>


            <span className="stage2-badge">
              USER INPUT
            </span>

          </div>


          {/* =================================================
              FORMULAS
          ================================================= */}

          <div className="stage2-formula-strip">

            <div>

              <span>
                User Strategy
              </span>

              <strong>
                ((Peak − Entry) ÷ Entry) × 100
              </strong>

            </div>


            <div>

              <span>
                Trader Strategy
              </span>

              <strong>
                ((Exit − Entry) ÷ Entry) × 100
              </strong>

            </div>

          </div>


          <form
            className="stage2-form"
            onSubmit={
              handleStage2Submit
            }
          >

            <div className="stage2-fields stage2-fields--four">

              {/* Coin */}

              <label className="stage2-field">

                <span>
                  Coin Name{" "}
                  <strong>*</strong>
                </span>

                <input
                  type="text"
                  value={
                    stage2CoinName
                  }
                  onChange={(event) =>
                    setStage2CoinName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bitcoin"
                  className="stage2-input"
                  autoComplete="off"
                  required
                />

              </label>


              {/* Entry */}

              <label className="stage2-field">

                <span>
                  Entry Price{" "}
                  <strong>*</strong>
                </span>

                <input
                  type="number"
                  min="0.00000001"
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
                  className="stage2-input"
                  required
                />

              </label>


              {/* Peak */}

              <label className="stage2-field">

                <span>
                  Peak Price{" "}
                  <strong>*</strong>
                </span>

                <input
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
                  className="stage2-input"
                  required
                />

              </label>


              {/* Exit */}

              <label className="stage2-field">

                <span>
                  Exit Price{" "}
                  <strong>*</strong>
                </span>

                <input
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
                  className="stage2-input"
                  required
                />

              </label>

            </div>


            {/* =================================================
                LIVE STRATEGY PREVIEW
            ================================================= */}

            <div className="stage2-preview">

              <div className="stage2-preview__title">
                Strategy Preview
              </div>


              <div className="stage2-preview__grid">

                <div className="strategy-preview-card">

                  <span>
                    User Strategy
                  </span>

                  <strong
                    className={
                      strategyClass(
                        liveStrategies.userStrategy
                      )
                    }
                  >
                    {formatPercentage(
                      liveStrategies.userStrategy
                    )}
                  </strong>

                  <small>
                    Peak vs Entry
                  </small>

                </div>


                <div className="strategy-preview-card">

                  <span>
                    Trader Strategy
                  </span>

                  <strong
                    className={
                      strategyClass(
                        liveStrategies.traderStrategy
                      )
                    }
                  >
                    {formatPercentage(
                      liveStrategies.traderStrategy
                    )}
                  </strong>

                  <small>
                    Exit vs Entry
                  </small>

                </div>

              </div>

            </div>


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
                SUBMIT
            ================================================= */}

            <div className="stage2-form-actions">

              <button
                type="submit"
                className="stage2-submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : "Calculate Strategy & Submit →"}
              </button>

            </div>

          </form>

        </section>

      )}


      {/* ===================================================
          STAGE 2 APPROVAL
      =================================================== */}

      {showStage2Actions && (

        <section className="panel">

          <div className="panel__header">

            <div>

              <h2 className="panel__title">
                Stage 2 Approval
              </h2>

              <p className="page__hint">
                Manager 1, Manager 2 and
                Admin can approve or reject
                the submitted Stage 2 details.
              </p>

            </div>


            <span className="badge">
              REVIEW REQUIRED
            </span>

          </div>


          {/* Stage 2 summary */}

          <div className="status-callout">

            <strong>
              Stage 2 details submitted.
            </strong>

            <p>
              Review the Coin Name, Entry,
              Peak, Exit and strategy
              percentages above before
              approving this stage.
            </p>

          </div>


          <textarea
            className="field__input field__textarea"
            rows="3"
            placeholder="Optional Stage 2 approval note"
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value
              )
            }
          />


          <div className="action-block__buttons">

            <button
              type="button"
              className="btn btn--success"
              disabled={loading}
              onClick={() =>
                handleStage2(
                  "approve"
                )
              }
            >
              ✓ Approve Stage 2
            </button>


            <button
              type="button"
              className="btn btn--danger"
              disabled={loading}
              onClick={() =>
                handleStage2(
                  "reject"
                )
              }
            >
              ✕ Reject Stage 2
            </button>

          </div>

        </section>

      )}


      {/* ===================================================
          STAGE 3 ADMIN FINAL APPROVAL
      =================================================== */}

      {showStage3Actions && (

        <section className="panel">

          <div className="panel__header">

            <div>

              <h2 className="panel__title">
                Stage 3 — Final Approval
              </h2>

              <p className="page__hint">
                Only Admin can perform
                the final approval.
              </p>

            </div>


            <span className="badge">
              ADMIN ONLY
            </span>

          </div>


          <div className="status-callout">

            <strong>
              Wallet passed Stage 1
              and Stage 2.
            </strong>

            <p>
              Final Admin approval is
              required before the wallet
              becomes Successful.
            </p>

          </div>


          <textarea
            className="field__input field__textarea"
            rows="3"
            placeholder="Optional final approval note"
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value
              )
            }
          />


          <div className="action-block__buttons">

            <button
              type="button"
              className="btn btn--success"
              disabled={loading}
              onClick={() =>
                handleStage3(
                  "approve"
                )
              }
            >
              ✓ Final Approve → Successful
            </button>


            <button
              type="button"
              className="btn btn--danger"
              disabled={loading}
              onClick={() =>
                handleStage3(
                  "reject"
                )
              }
            >
              ✕ Reject Stage 3
            </button>

          </div>

        </section>

      )}


      {/* ===================================================
          CURRENT STATUS
      =================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Current status
          </h2>

        </div>


        <div className="status-callout">

          <strong>
            {wallet.status}
          </strong>


          <p>

            {wallet.status ===
              "Pending Stage 1" &&
              "This wallet is waiting for Stage 1 approval."}


            {wallet.status ===
              "Pending Stage 2" &&
              !hasStage2Data &&
              "Stage 1 has passed. Stage 2 trade details are required from the wallet owner."}


            {wallet.status ===
              "Pending Stage 2" &&
              hasStage2Data &&
              "Stage 2 trade details have been submitted and are waiting for manager or admin approval."}


            {wallet.status ===
              "Pending Stage 3" &&
              "Stage 2 has passed. The wallet is waiting for final Admin approval."}


            {wallet.status ===
              "Successful" &&
              "Final Admin approval is complete. This wallet is successful."}


            {wallet.status ===
              "Failed" &&
              "This wallet was rejected during the approval process."}

          </p>

        </div>

      </section>


      {/* ===================================================
          APPROVAL HISTORY
      =================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Approval History
          </h2>

        </div>


        {wallet.history &&
        wallet.history.length > 0 ? (

          <ol className="timeline">

            {[
              ...wallet.history,
            ]
              .reverse()
              .map(
                (
                  item,
                  index
                ) => {

                  const historyId =
                    item._id ||
                    item.id ||
                    index;


                  return (
                    <li
                      key={
                        historyId
                      }
                      className="timeline__item"
                    >

                      <span className="timeline__dot" />


                      <div className="timeline__body">

                        <p className="timeline__title">

                          {
                            LABELS[
                              item.type
                            ] ||
                            "Update"
                          }


                          {item.by && (
                            <span className="timeline__by">
                              {" "}
                              —{" "}
                              {item.by}
                            </span>
                          )}

                        </p>


                        {item.detail && (
                          <p className="timeline__detail">
                            {item.detail}
                          </p>
                        )}


                        {item.at && (
                          <p className="timeline__time">
                            {formatDateTime(
                              item.at
                            )}
                          </p>
                        )}

                      </div>

                    </li>
                  );
                }
              )}

          </ol>

        ) : (

          <div className="empty-state">

            <p>
              No approval history yet.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}