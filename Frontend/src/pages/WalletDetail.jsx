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
import Stage2Form from "./Stage2Form";
import { editRejectedStage2CoinRequest } from "../lib/api";

import {
  formatDateTime,
} from "../lib/utils";



function Stage2CoinEditor({ walletId, item, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [coinName, setCoinName] = useState(item.coinName || "");
  const [entryPrice, setEntryPrice] = useState(String(item.entryPrice ?? ""));
  const [peakPrice, setPeakPrice] = useState(String(item.peakPrice ?? ""));
  const [exitPrice, setExitPrice] = useState(String(item.exitPrice ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (item.status !== "Rejected") return null;
  if (!editing) return <button type="button" className="btn btn--primary" onClick={() => setEditing(true)}>Edit rejected coin</button>;

  async function save(event) {
    event.preventDefault();
    setError("");
    const entry = Number(entryPrice), peak = Number(peakPrice), exit = Number(exitPrice);
    if (!coinName.trim() || !Number.isFinite(entry) || entry <= 0 || !Number.isFinite(peak) || peak < 0 || !Number.isFinite(exit) || exit < 0) {
      setError("Enter a coin name, a valid entry price above 0, and valid peak/exit prices.");
      return;
    }
    setSaving(true);
    try {
      await editRejectedStage2CoinRequest(walletId, item._id, { coinName: coinName.trim(), entryPrice: entry, peakPrice: peak, exitPrice: exit });
      await onSaved();
      setEditing(false);
    } catch (e) { setError(e?.message || "Could not update this coin."); }
    finally { setSaving(false); }
  }

  return <form onSubmit={save} style={{ display: "grid", gap: 10, minWidth: 230 }}>
    <label>Coin name<input className="field__input" value={coinName} onChange={e => setCoinName(e.target.value)} required /></label>
    <label>Entry price<input className="field__input" type="number" min="0.00000001" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} required /></label>
    <label>Peak price<input className="field__input" type="number" min="0" step="any" value={peakPrice} onChange={e => setPeakPrice(e.target.value)} required /></label>
    <label>Exit price<input className="field__input" type="number" min="0" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)} required /></label>
    {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
    <div style={{ display: "flex", gap: 8 }}><button className="btn btn--success" type="submit" disabled={saving}>{saving ? "Saving…" : "Save and resubmit"}</button><button className="btn" type="button" disabled={saving} onClick={() => { setEditing(false); setError(""); }}>Cancel</button></div>
  </form>;
}

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
   STAGE 2 STRATEGY STATISTICS
========================================================= */

const STAGE2_STAT_COLUMNS = [
  ["below0", "Below 0"],
  ["zero", "0"],
  ["0to50", "0–50"],
  ["51to100", "51–100"],
  ["above100", "Above 100"],
];

function getStatsValue(
  stats,
  key
) {
  return stats?.[key] ?? 0;
}

function createEmptyStrategyStats() {
  return {
    below0: 0,
    zero: 0,
    "0to50": 0,
    "51to100": 0,
    above100: 0,
  };
}

function calculateWalletStrategyStats(items) {
  const userStrategy = createEmptyStrategyStats();
  const traderStrategy = createEmptyStrategyStats();

  const addToBucket = (stats, value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return;

    if (number < 0) stats.below0 += 1;
    else if (number === 0) stats.zero += 1;
    else if (number <= 50) stats["0to50"] += 1;
    else if (number <= 100) stats["51to100"] += 1;
    else stats.above100 += 1;
  };

  items.forEach((item) => {
    addToBucket(
      userStrategy,
      item.userStrategyPL ?? item.userStrategy
    );
    addToBucket(
      traderStrategy,
      item.traderStrategyPL ?? item.traderStrategy
    );
  });

  return {
    totalItems: items.length,
    userStrategy,
    traderStrategy,
  };
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

  const canReviewStage2 =
    [
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
     STAGE 2 ITEMS

     New wallets use stage2Items. Legacy wallets are normalized
     into a one-item array so the detail page can render both
     formats consistently.
  ======================================================= */

  const stage2Items =
    useMemo(() => {
      if (
        Array.isArray(wallet?.stage2Items) &&
        wallet.stage2Items.length
      ) {
        return wallet.stage2Items;
      }

      if (
        wallet?.coinName &&
        wallet?.entryPrice != null &&
        wallet?.peakPrice != null &&
        wallet?.exitPrice != null
      ) {
        return [
          {
            coinName: wallet.coinName,
            entryPrice: wallet.entryPrice,
            peakPrice: wallet.peakPrice,
            exitPrice: wallet.exitPrice,
            userStrategyPL:
              wallet.userStrategyPL ??
              wallet.userStrategy ??
              null,
            traderStrategyPL:
              wallet.traderStrategyPL ??
              wallet.traderStrategy ??
              null,
            userStrategy:
              wallet.userStrategy ??
              wallet.userStrategyPL ??
              null,
            traderStrategy:
              wallet.traderStrategy ??
              wallet.traderStrategyPL ??
              null,
          },
        ];
      }

      return [];
    }, [wallet]);


  const walletStrategyStats = useMemo(
    () => calculateWalletStrategyStats(stage2Items),
    [stage2Items]
  );


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
    stage2Items.length > 0;

  const allStage2CoinsApproved =
    hasStage2Data && stage2Items.every((item) => item.status === "Approved");


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
     STAGE 2 INDIVIDUAL COIN DECISION
  ======================================================= */

  async function handleStage2(
    submissionId,
    decision
  ) {
    setError("");
    setLoading(true);

    try {
      const response =
        await stage2Decision(
          id,
          {
            submissionId,
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
        "Unable to process Stage 2 coin."
      );

    } finally {
      setLoading(false);
    }
  }


  async function handleStage2FinalApproval() {
    setError("");
    setLoading(true);
    try {
      const response = await stage2Decision(id, { decision: "final_approve", note });
      setWallet(response.wallet);
      setNote("");
    } catch (err) {
      setError(err?.message || "Unable to finalize Stage 2 approval.");
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
              <span className="stage2-details-table-count">
                {stage2Items.length} {stage2Items.length === 1 ? "coin" : "coins"}
              </span>
            </div>

            <div className="table-wrap">

              <table className="data-table stage2-trade-table">

                <thead>
                  <tr>
                    <th>Coin Name</th>
                    <th>Entry Price</th>
                    <th>Peak Price</th>
                    <th>Exit Price</th>
                    <th>User Strategy</th>
                    <th>Trader Strategy</th>
                    {isOwner && wallet?.stage === 2 && <th>Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {stage2Items.map((item, index) => {
                    const itemUserStrategy =
                      item.userStrategyPL ?? item.userStrategy;
                    const itemTraderStrategy =
                      item.traderStrategyPL ?? item.traderStrategy;

                    return (
                      <tr key={item._id || `${wallet.id}-stage2-${index}`}>
                        <td>
                          <strong>{item.coinName || "—"}</strong>
                        </td>
                        <td>{item.entryPrice != null ? item.entryPrice : "—"}</td>
                        <td>{item.peakPrice != null ? item.peakPrice : "—"}</td>
                        <td>{item.exitPrice != null ? item.exitPrice : "—"}</td>
                        <td>
                          <span className={strategyClass(itemUserStrategy)}>
                            {formatPercentage(itemUserStrategy)}
                          </span>
                        </td>
                        <td>
                          <span className={strategyClass(itemTraderStrategy)}>
                            {formatPercentage(itemTraderStrategy)}
                          </span>
                        </td>
                        {isOwner && wallet?.stage === 2 && <td>
                          {item.status === "Rejected" ? <Stage2CoinEditor walletId={id} item={item} onSaved={loadWallet} /> : <span>{item.status || "Pending"}</span>}
                          {item.status === "Rejected" && item.reviewNote && <p className="page__hint">Reason: {item.reviewNote}</p>}
                        </td>}
                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>

          </div>

        )}

      </section>


      {/* =================================================
          STAGE 2 STRATEGY STATISTICS

          Counts are calculated only from this wallet's coins.
          Visible to every authenticated role.
      ================================================= */}

      <section className="stage2-strategy-stats-panel">

        <div className="stage2-strategy-stats-header">

          <div>
            <span className="stage2-strategy-stats-eyebrow">
              STAGE 2 STATISTICS
            </span>

            <h2>
              Strategy distribution for this wallet
            </h2>
          </div>

          <div className="stage2-strategy-stats-total">
            <span>Total coin entries</span>
            <strong>
              {walletStrategyStats.totalItems}
            </strong>
          </div>

        </div>

        <div className="stage2-strategy-stats-row">

          <div className="stage2-strategy-stats-label">
            User Strategy
          </div>

          {STAGE2_STAT_COLUMNS.map(
            ([key, label]) => (
              <div
                className="stage2-strategy-stat-cell"
                key={`wallet-user-stat-${key}`}
              >
                <span>{label}</span>
                <strong>
                  {getStatsValue(
                    walletStrategyStats.userStrategy,
                    key
                  )}
                </strong>
              </div>
            )
          )}

        </div>

        <div className="stage2-strategy-stats-row">

          <div className="stage2-strategy-stats-label">
            Trader Strategy
          </div>

          {STAGE2_STAT_COLUMNS.map(
            ([key, label]) => (
              <div
                className="stage2-strategy-stat-cell"
                key={`wallet-trader-stat-${key}`}
              >
                <span>{label}</span>
                <strong>
                  {getStatsValue(
                    walletStrategyStats.traderStrategy,
                    key
                  )}
                </strong>
              </div>
            )
          )}

        </div>

        <p className="stage2-strategy-stats-note">
          Counts are calculated only from this wallet's Stage 2 coin entries.
          Negative values are Below 0, zero is 0, 0–50 is above 0 through 50,
          51–100 is above 50 through 100, and Above 100 is greater than 100.
        </p>

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
        <Stage2Form
          wallet={wallet}
          onSubmitted={loadWallet}
        />
      )}


      {/* ===================================================
          STAGE 2 INDIVIDUAL COIN REVIEW
      =================================================== */}

      {showStage2Actions && canReviewStage2 && (

        <section className="panel">

          <div className="panel__header">

            <div>

              <h2 className="panel__title">
                Stage 2 Coin Review
              </h2>

              <p className="page__hint">
                Review each submitted coin separately.
                Approving or rejecting one coin does not
                change the status of the other coins.
              </p>

            </div>

            <span className="badge">
              {stage2Items.length}{" "}
              {stage2Items.length === 1
                ? "COIN"
                : "COINS"}
            </span>

          </div>


          <div
            className="stage2-review-list"
            style={{
              display: "grid",
              gap: 16,
            }}
          >

            {stage2Items.map(
              (item, index) => {

                const itemStatus =
                  item.status ||
                  "Pending";

                const itemUserStrategy =
                  item.userStrategyPL ??
                  item.userStrategy;

                const itemTraderStrategy =
                  item.traderStrategyPL ??
                  item.traderStrategy;

                const isPending =
                  itemStatus ===
                  "Pending";

                return (
                  <div
                    key={
                      item._id ||
                      `stage2-review-${index}`
                    }
                    className="panel"
                    style={{
                      margin: 0,
                      border:
                        "1px solid rgba(148,163,184,.22)",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: 12,
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <div>

                        <h3
                          style={{
                            margin:
                              "0 0 6px",
                          }}
                        >
                          {item.coinName ||
                            "Unnamed Coin"}
                        </h3>

                        <div
                          className="page__hint"
                        >
                          Coin #{index + 1}
                        </div>

                      </div>

                      <span
                        className="badge"
                      >
                        {itemStatus}
                      </span>

                    </div>


                    <div
                      className="detail-list"
                      style={{
                        marginTop: 16,
                      }}
                    >

                      <div className="detail-list__row">
                        <dt>Entry Price</dt>
                        <dd>
                          {item.entryPrice ??
                            "—"}
                        </dd>
                      </div>

                      <div className="detail-list__row">
                        <dt>Peak Price</dt>
                        <dd>
                          {item.peakPrice ??
                            "—"}
                        </dd>
                      </div>

                      <div className="detail-list__row">
                        <dt>Exit Price</dt>
                        <dd>
                          {item.exitPrice ??
                            "—"}
                        </dd>
                      </div>

                      <div className="detail-list__row">
                        <dt>User Strategy</dt>
                        <dd>
                          {formatPercentage(
                            itemUserStrategy
                          )}
                        </dd>
                      </div>

                      <div className="detail-list__row">
                        <dt>Trader Strategy</dt>
                        <dd>
                          {formatPercentage(
                            itemTraderStrategy
                          )}
                        </dd>
                      </div>

                      {item.reviewedByName && (
                        <div className="detail-list__row">
                          <dt>Reviewed By</dt>
                          <dd>
                            {item.reviewedByName}
                          </dd>
                        </div>
                      )}

                      {item.reviewNote && (
                        <div className="detail-list__row">
                          <dt>Review Note</dt>
                          <dd>
                            {item.reviewNote}
                          </dd>
                        </div>
                      )}

                    </div>


                    {isPending && (
                      <>
                        <textarea
                          className="field__input field__textarea"
                          rows="2"
                          placeholder={
                            `Optional note for ${item.coinName || "this coin"}`
                          }
                          value={note}
                          onChange={(event) =>
                            setNote(
                              event.target.value
                            )
                          }
                          style={{
                            marginTop: 16,
                          }}
                        />

                        <div
                          className="action-block__buttons"
                          style={{
                            marginTop: 12,
                          }}
                        >

                          <button
                            type="button"
                            className="btn btn--success"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              handleStage2(
                                item._id,
                                "approve"
                              )
                            }
                          >
                            ✓ Approve{" "}
                            {item.coinName ||
                              "Coin"}
                          </button>

                          <button
                            type="button"
                            className="btn btn--danger"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              handleStage2(
                                item._id,
                                "reject"
                              )
                            }
                          >
                            ✕ Reject{" "}
                            {item.coinName ||
                              "Coin"}
                          </button>

                        </div>
                      </>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </section>

      )}


      {/* ===================================================
          STAGE 3 ADMIN FINAL APPROVAL
      =================================================== */}

            {canReviewStage2 && wallet?.stage === 2 && wallet?.status === "Pending Stage 2" && allStage2CoinsApproved && (
        <section className="panel">
          <h2 className="panel__title">Stage 2 Final Approval</h2>
          <p className="page__hint">All submitted coins are approved. This button moves the wallet to Stage 3. The user can continue adding coins until this action is taken.</p>
          <button type="button" className="btn btn--success" disabled={loading} onClick={handleStage2FinalApproval}>
            ✓ Final Approve Stage 2 → Stage 3
          </button>
        </section>
      )}

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