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


export default function Wallets() {
  const {
    getWallets,
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      // Keep the existing table visible during refreshes; only show the
      // full-page loading state before the first successful load.
      if (wallets.length === 0) setLoading(true);

      const params = new URLSearchParams();

      if (status !== "All") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      params.set("limit", "200");

      const walletResponse =
        await getWallets(params.toString());

      setWallets(walletResponse.wallets || []);
    } catch (err) {
      setError(err?.message || "Unable to load wallets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch on initial load and when filters change. No background polling,
    // so the page does not repeatedly show "Loading wallets" every few seconds.
    const timeout = setTimeout(() => {
      load();
    }, search.trim() ? 300 : 0);

    return () => clearTimeout(timeout);
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
   * All coin entries remain visible here; aggregate statistics live on the
   * dedicated Statistics page.
   */
  const stage2Rows = useMemo(() => {
    if (!isStage2) return [];

    return wallets.flatMap((wallet) =>
      getStage2Items(wallet).map((item, index) => ({
        ...wallet,
        ...item,
        rowId: `${wallet.id}-stage2-${item._id || index}`,
        walletId: wallet.id,
        itemIndex: index,
      }))
    );
  }, [wallets, isStage2]);

  const visibleRows = isStage2 ? stage2Rows : wallets;

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
                ? "All submitted coin entries for Stage 2"
                : "Review and manage wallets in the approval pipeline"}
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
                          title={isStage2 ? "Open this Trade ID and view every coin submitted under it" : "View wallet details"}
                        >
                          {isStage2 ? "View all coins" : "View"}
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
                          ? "No Stage 2 coin entries are available."
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
