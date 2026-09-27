import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  useData,
} from "../lib/store";

import Badge from "../components/Badge";

import {
  formatDateTime,
} from "../lib/utils";


const STATUS_OPTIONS = [
  "All",
  "Pending Stage 1",
  "Pending Stage 2",
  "Pending Stage 3",
  "Successful",
  "Failed",
];


/*
 * Stage 2 strategy buckets.
 *
 * Below 0 = negative strategy
 * 0 = exactly zero
 * 0–50 = > 0 and <= 50
 * 51–100 = > 50 and <= 100
 * Above 100 = > 100
 */
const STRATEGY_RANGES = [
  { key: "all", label: "All" },
  { key: "zero", label: "0" },
  { key: "0-50", label: "0–50" },
  { key: "51-100", label: "51–100" },
  { key: "above-100", label: "Above 100" },
];


function matchesStrategyRange(value, range) {
  if (range === "all") return true;

  const number = Number(value);

  if (!Number.isFinite(number)) return false;

  if (range === "zero") return number === 0;
  if (range === "0-50") return number > 0 && number <= 50;
  if (range === "51-100") return number > 50 && number <= 100;
  if (range === "above-100") return number > 100;

  return true;
}


function getStage2Items(wallet) {
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
          wallet.userStrategyPL ?? wallet.userStrategy ?? null,
        traderStrategyPL:
          wallet.traderStrategyPL ?? wallet.traderStrategy ?? null,
        userStrategy:
          wallet.userStrategy ?? wallet.userStrategyPL ?? null,
        traderStrategy:
          wallet.traderStrategy ?? wallet.traderStrategyPL ?? null,
      },
    ];
  }

  /* Keep an empty Stage 2 wallet visible so the owner can open it. */
  return [{}];
}


function getStatsValue(stats, key) {
  return stats?.[key] ?? 0;
}


export default function Wallets() {
  const {
    getWallets,
    getStrategyStats,
    currentUser,
  } = useData();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus =
    searchParams.get("status") || "All";

  const [status, setStatus] = useState(
    STATUS_OPTIONS.includes(initialStatus)
      ? initialStatus
      : "All"
  );

  const [wallets, setWallets] = useState([]);
  const [strategyStats, setStrategyStats] = useState(null);
  const [search, setSearch] = useState("");
  const [userStrategyRange, setUserStrategyRange] = useState("all");
  const [traderStrategyRange, setTraderStrategyRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);

      const params = new URLSearchParams();

      if (status !== "All") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      params.set("limit", "200");

      const [walletResponse, statsResponse] =
        await Promise.all([
          getWallets(params.toString()),
          getStrategyStats(),
        ]);

      setWallets(walletResponse.wallets || []);
      setStrategyStats(statsResponse.strategyStats || null);
    } catch (err) {
      setError(err?.message || "Unable to load wallets.");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [status, search]);

  function changeStatus(value) {
    setStatus(value);

    if (value === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  }

  const title =
    status === "All"
      ? "Wallet Pipeline"
      : status;

  const isStage2 =
    status === "Pending Stage 2";

  /*
   * Flatten Stage 2 wallets into coin rows.
   * One wallet can now contain N coin entries.
   */
  const stage2Rows = useMemo(() => {
    if (!isStage2) return [];

    return wallets.flatMap((wallet) =>
      getStage2Items(wallet).map((item, index) => ({
        ...wallet,
        ...item,
        rowId:
          `${wallet.id}-stage2-${item._id || index}`,
        walletId: wallet.id,
        itemIndex: index,
      }))
    );
  }, [wallets, isStage2]);

  const visibleStage2Rows = useMemo(() => {
    if (!isStage2) return [];

    return stage2Rows.filter((row) => {
      const userPL =
        row.userStrategyPL ?? row.userStrategy;
      const traderPL =
        row.traderStrategyPL ?? row.traderStrategy;

      return (
        matchesStrategyRange(
          userPL,
          userStrategyRange
        ) &&
        matchesStrategyRange(
          traderPL,
          traderStrategyRange
        )
      );
    });
  }, [
    stage2Rows,
    isStage2,
    userStrategyRange,
    traderStrategyRange,
  ]);

  const visibleStage2WalletCount =
    useMemo(() => {
      if (!isStage2) return 0;

      return new Set(
        visibleStage2Rows.map(
          (row) => row.walletId
        )
      ).size;
    }, [
      visibleStage2Rows,
      isStage2,
    ]);

  const totalStage2WalletCount =
    useMemo(() => {
      if (!isStage2) return 0;

      return new Set(
        stage2Rows.map(
          (row) => row.walletId
        )
      ).size;
    }, [
      stage2Rows,
      isStage2,
    ]);

  const visibleRows =
    isStage2
      ? visibleStage2Rows
      : wallets;

  function resetStrategyFilters() {
    setUserStrategyRange("all");
    setTraderStrategyRange("all");
  }

  const userStats =
    strategyStats?.userStrategy || {};
  const traderStats =
    strategyStats?.traderStrategy || {};

  const statColumns = [
    ["zero", "0"],
    ["0to50", "0–50"],
    ["51to100", "51–100"],
    ["above100", "Above 100"],
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            {title}
          </h1>

          <p className="page__subtitle">
            All wallets available to{" "}
            {currentUser?.role === "user"
              ? "you"
              : "your role"}{" "}
            in the approval pipeline.
          </p>
        </div>

        {currentUser?.role === "user" && (
          <Link
            to="/create-wallet"
            className="btn btn--primary"
          >
            + Add Wallet
          </Link>
        )}
      </div>

      <section className="panel">
        <div className="pipeline pipeline--compact">
          {STATUS_OPTIONS.map((item, index) => {
            const label =
              item === "All"
                ? "All"
                : item.replace("Pending ", "");

            return (
              <React.Fragment key={item}>
                <button
                  type="button"
                  className={`pipeline-filter ${
                    status === item
                      ? "pipeline-filter--active"
                      : ""
                  }`}
                  onClick={() => changeStatus(item)}
                >
                  {label}
                </button>

                {index < STATUS_OPTIONS.length - 1 && (
                  <span className="pipeline-arrow">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {isStage2 && (
        <>
          {/* =================================================
              STAGE 2 RANGE FILTERS
          ================================================= */}
          <section className="stage2-strategy-filter-panel">
            <div className="stage2-strategy-filter-row">
              <div className="stage2-strategy-filter-heading">
                <span className="stage2-strategy-filter-title">
                  User Strategy
                </span>
                <span className="stage2-strategy-filter-value">
                  {STRATEGY_RANGES.find(
                    (item) =>
                      item.key === userStrategyRange
                  )?.label}
                </span>
              </div>

              <div
                className="stage2-strategy-range-list"
                aria-label="User Strategy range"
              >
                {STRATEGY_RANGES.map((item) => (
                  <button
                    key={`user-${item.key}`}
                    type="button"
                    className={`stage2-strategy-range ${
                      userStrategyRange === item.key
                        ? "stage2-strategy-range--active"
                        : ""
                    }`}
                    onClick={() =>
                      setUserStrategyRange(item.key)
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stage2-strategy-filter-row">
              <div className="stage2-strategy-filter-heading">
                <span className="stage2-strategy-filter-title">
                  Trader Strategy
                </span>
                <span className="stage2-strategy-filter-value">
                  {STRATEGY_RANGES.find(
                    (item) =>
                      item.key === traderStrategyRange
                  )?.label}
                </span>
              </div>

              <div
                className="stage2-strategy-range-list"
                aria-label="Trader Strategy range"
              >
                {STRATEGY_RANGES.map((item) => (
                  <button
                    key={`trader-${item.key}`}
                    type="button"
                    className={`stage2-strategy-range ${
                      traderStrategyRange === item.key
                        ? "stage2-strategy-range--active"
                        : ""
                    }`}
                    onClick={() =>
                      setTraderStrategyRange(item.key)
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stage2-strategy-filter-footer">
              <span>
                Showing <strong>{visibleStage2WalletCount}</strong> of{" "}
                <strong>{totalStage2WalletCount}</strong> Stage 2 wallets
              </span>

              {(userStrategyRange !== "all" ||
                traderStrategyRange !== "all") && (
                <button
                  type="button"
                  className="stage2-strategy-clear"
                  onClick={resetStrategyFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {/* =================================================
              STAGE 2 STRATEGY COUNT BOARD

              This is shared across all users, managers and admin.
          ================================================= */}
          <section className="stage2-strategy-stats-panel">
            <div className="stage2-strategy-stats-header">
              <div>
                <span className="stage2-strategy-stats-eyebrow">
                  STAGE 2 STATISTICS
                </span>
                <h2>
                  Strategy distribution across all Stage 2 entries
                </h2>
              </div>

              <div className="stage2-strategy-stats-total">
                <span>Total coin entries</span>
                <strong>
                  {statsLoading
                    ? "…"
                    : strategyStats?.totalItems ?? 0}
                </strong>
              </div>
            </div>

            <div className="stage2-strategy-stats-row">
              <div className="stage2-strategy-stats-label">
                User Strategy
              </div>

              {statColumns.map(([key, label]) => (
                <div
                  className="stage2-strategy-stat-cell"
                  key={`user-stat-${key}`}
                >
                  <span>{label}</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : getStatsValue(userStats, key)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="stage2-strategy-stats-row">
              <div className="stage2-strategy-stats-label">
                Trader Strategy
              </div>

              {statColumns.map(([key, label]) => (
                <div
                  className="stage2-strategy-stat-cell"
                  key={`trader-stat-${key}`}
                >
                  <span>{label}</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : getStatsValue(traderStats, key)}
                  </strong>
                </div>
              ))}
            </div>

            <p className="stage2-strategy-stats-note">
              Counts are calculated per coin entry, so one wallet containing
              100 coins contributes 100 entries to these statistics.
            </p>
          </section>
        </>
      )}

      <section className="panel">
        <div className="wallet-toolbar">
          <input
            className="field__input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coin name or Trade ID..."
          />

          <select
            className="field__input"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">
              {status === "All"
                ? "All Wallets"
                : `${status} Wallets`}
            </h2>

            <p className="page__hint">
              {isStage2
                ? `${visibleStage2WalletCount} of ${totalStage2WalletCount} Stage 2 wallets`
                : `${wallets.length} wallet${wallets.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading wallets...
          </div>
        ) : (
          <div className="table-wrap">
            <table
              className={`data-table ${
                isStage2 ? "data-table--stage2" : ""
              }`}
            >
              <thead>
                {isStage2 ? (
                  <tr>
                    <th>Coin</th>
                    <th>Trade ID</th>
                    <th>Entry Price</th>
                    <th>Peak Price</th>
                    <th>Exit Price</th>
                    <th>User Strategy</th>
                    <th>Trader Strategy</th>
                    <th>Created By</th>
                    <th>Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Coin</th>
                    <th>Trade ID</th>
                    <th>Created By</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {visibleRows.map((wallet) => {
                  const userPL =
                    wallet.userStrategyPL ??
                    wallet.userStrategy;
                  const traderPL =
                    wallet.traderStrategyPL ??
                    wallet.traderStrategy;

                  return (
                    <tr key={isStage2 ? wallet.rowId : wallet.id}>
                      <td>
                        <strong>
                          {wallet.coinName || "—"}
                        </strong>
                      </td>

                      <td className="mono-cell">
                        {wallet.tradeId}
                      </td>

                      {isStage2 ? (
                        <>
                          <td>
                            {wallet.entryPrice != null
                              ? wallet.entryPrice
                              : "—"}
                          </td>

                          <td>
                            {wallet.peakPrice != null
                              ? wallet.peakPrice
                              : "—"}
                          </td>

                          <td>
                            {wallet.exitPrice != null
                              ? wallet.exitPrice
                              : "—"}
                          </td>

                          <td>
                            <span
                              className={
                                userPL == null
                                  ? "strategy-value"
                                  : userPL >= 0
                                    ? "strategy-value strategy-value--positive"
                                    : "strategy-value strategy-value--negative"
                              }
                            >
                              {userPL != null
                                ? `${userPL > 0 ? "+" : ""}${Number(userPL).toFixed(2)}%`
                                : "Pending"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                traderPL == null
                                  ? "strategy-value"
                                  : traderPL >= 0
                                    ? "strategy-value strategy-value--positive"
                                    : "strategy-value strategy-value--negative"
                              }
                            >
                              {traderPL != null
                                ? `${traderPL > 0 ? "+" : ""}${Number(traderPL).toFixed(2)}%`
                                : "Pending"}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {wallet.userName || "—"}
                            </strong>
                            <div className="table-sub">
                              {wallet.userRole || "user"}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>
                              {wallet.userName || "—"}
                            </strong>
                            <div className="table-sub">
                              {wallet.userRole || wallet.creatorRole || "user"}
                            </div>
                          </td>

                          <td>
                            <span className="badge">
                              Stage {wallet.stage}
                            </span>
                          </td>

                          <td>
                            <Badge status={wallet.status} />
                          </td>

                          <td>
                            {formatDateTime(wallet.lastUpdated || wallet.updatedAt)}
                          </td>
                        </>
                      )}

                      <td>
                        <Link
                          to={`/wallets/${wallet.walletId || wallet.id}`}
                          className="btn btn--small btn--primary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {!visibleRows.length && (
                  <tr>
                    <td
                      colSpan={isStage2 ? 9 : 7}
                      className="empty-row"
                    >
                      {isStage2
                        ? wallets.length
                          ? "No Stage 2 coin entries match the selected strategy ranges."
                          : "No wallets are currently waiting for Stage 2."
                        : "No wallets found in this stage."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
