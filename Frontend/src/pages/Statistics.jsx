import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../lib/store";

const BUCKETS = [
  ["below0", "Below 0"],
  ["zero", "0"],
  ["0to50", "0–50"],
  ["51to100", "51–100"],
  ["above100", "Above 100"],
];

function StatRow({ label, values = {} }) {
  return (
    <div className="stage2-strategy-stats-row">
      <div className="stage2-strategy-stats-label">{label}</div>
      {BUCKETS.map(([key, title]) => (
        <div className="stage2-strategy-stat-cell" key={`${label}-${key}`}>
          <span>{title}</span>
          <strong>{values[key] ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

function getStage2Items(wallet) {
  if (Array.isArray(wallet?.stage2Items) && wallet.stage2Items.length) {
    return wallet.stage2Items;
  }

  if (wallet?.coinName) {
    return [{
      coinName: wallet.coinName,
      entryPrice: wallet.entryPrice,
      peakPrice: wallet.peakPrice,
      exitPrice: wallet.exitPrice,
      userStrategyPL: wallet.userStrategyPL ?? wallet.userStrategy ?? null,
      traderStrategyPL: wallet.traderStrategyPL ?? wallet.traderStrategy ?? null,
      userStrategy: wallet.userStrategy ?? wallet.userStrategyPL ?? null,
      traderStrategy: wallet.traderStrategy ?? wallet.traderStrategyPL ?? null,
      status: wallet.status,
    }];
  }

  return [];
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 8 }) : value;
}

function formatStrategy(value) {
  if (value === null || value === undefined || value === "") return "Pending";
  const number = Number(value);
  return Number.isFinite(number) ? `${number > 0 ? "+" : ""}${number.toFixed(2)}%` : value;
}

export default function Statistics() {
  const { getStrategyStats, getWallets } = useData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCoinDetails, setShowCoinDetails] = useState(false);
  const [coinWallets, setCoinWallets] = useState([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsError, setCoinsError] = useState("");
  const [coinsLoaded, setCoinsLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getStrategyStats();
      setStats(response?.strategyStats || {});
    } catch (err) {
      setError(err?.message || "Unable to load Stage 2 statistics.");
    } finally {
      setLoading(false);
    }
  }, [getStrategyStats]);

  useEffect(() => { load(); }, [load]);

  const coinRows = useMemo(() => coinWallets.flatMap((wallet) => {
    const items = getStage2Items(wallet);
    return items.map((item, index) => ({
      ...item,
      rowId: `${wallet.id || wallet._id || wallet.tradeId || "wallet"}-${item._id || index}`,
      walletId: wallet.id || wallet._id,
      tradeId: wallet.tradeId || wallet.tradeIdNormalized || wallet.traderId || "—",
      walletStatus: item.status || wallet.status || "—",
      userName: wallet.userName || wallet.createdByName || wallet.ownerName || "—",
    }));
  }), [coinWallets]);

  async function toggleCoinDetails() {
    const nextOpen = !showCoinDetails;
    setShowCoinDetails(nextOpen);
    if (!nextOpen || coinsLoaded || coinsLoading) return;

    setCoinsLoading(true);
    setCoinsError("");
    try {
      // Use the Stage 2 filter so the detail list matches the statistics card.
      const response = await getWallets("status=Pending%20Stage%202&limit=500");
      setCoinWallets(Array.isArray(response?.wallets) ? response.wallets : []);
      setCoinsLoaded(true);
    } catch (err) {
      setCoinsError(err?.message || "Unable to load Stage 2 coin details.");
    } finally {
      setCoinsLoading(false);
    }
  }

  async function retryCoinDetails() {
    setCoinsLoaded(false);
    setCoinWallets([]);
    setCoinsError("");
    setCoinsLoading(true);
    try {
      const response = await getWallets("status=Pending%20Stage%202&limit=500");
      setCoinWallets(Array.isArray(response?.wallets) ? response.wallets : []);
      setCoinsLoaded(true);
    } catch (err) {
      setCoinsError(err?.message || "Unable to load Stage 2 coin details.");
    } finally {
      setCoinsLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Stage 2 Statistics</h1>
          <p className="page__subtitle">
            Global User Strategy and Trader Strategy distribution across all wallets currently in Stage 2.
            Counts are calculated per coin entry and are shared across user, manager, and admin roles.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
        <section className="stat-card">
          <span className="stat-card__label">Stage 2 Wallets</span>
          <strong className="stat-card__value">{loading && !stats ? "—" : stats?.totalWallets ?? 0}</strong>
        </section>
        <section className="stat-card">
          <span className="stat-card__label">Total Coin Entries</span>
          <strong className="stat-card__value">{loading && !stats ? "—" : stats?.totalItems ?? 0}</strong>
        </section>
      </div>

      <section className="stage2-strategy-stats-panel">
        <div className="stage2-strategy-stats-header">
          <div>
            <span className="stage2-strategy-stats-eyebrow">GLOBAL STAGE 2 STATISTICS</span>
            <h2>Strategy distribution across all wallets</h2>
          </div>
        </div>
        {loading && !stats ? (
          <div className="empty-state">Loading statistics…</div>
        ) : (
          <div className="stage2-wallet-stats-list">
            <div className="stage2-wallet-stats-card">
              <div className="stage2-wallet-stats-card-header">
                <div>
                  <span className="stage2-strategy-stats-eyebrow">AGGREGATED TOTALS</span>
                  <h3>All Stage 2 wallets</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <div className="stage2-strategy-stats-total">
                    <span>Total coin entries</span>
                    <strong>{stats?.totalItems ?? 0}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary btn--small"
                    onClick={toggleCoinDetails}
                    aria-expanded={showCoinDetails}
                  >
                    {showCoinDetails ? "Hide coin details" : "View coin details"}
                  </button>
                </div>
              </div>
              <StatRow label="User Strategy" values={stats?.userStrategy} />
              <StatRow label="Trader Strategy" values={stats?.traderStrategy} />

              {showCoinDetails && (
                <div style={{ marginTop: 18, borderTop: "1px solid var(--border, #263247)", paddingTop: 16 }}>
                  <div className="panel__header" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 className="panel__title">Stage 2 Coin Details</h3>
                      <p className="page__hint">
                        {coinsLoading ? "Loading coin entries…" : `${coinRows.length} coin ${coinRows.length === 1 ? "entry" : "entries"} found across Stage 2 wallets`}
                      </p>
                    </div>
                    {coinsError && <button type="button" className="btn btn--ghost btn--small" onClick={retryCoinDetails} disabled={coinsLoading}>Retry</button>}
                  </div>

                  {coinsLoading ? (
                    <div className="empty-state">Loading all Stage 2 coin details…</div>
                  ) : coinsError ? (
                    <p className="form-error" role="alert">{coinsError}</p>
                  ) : coinRows.length === 0 ? (
                    <div className="empty-state">No Stage 2 coin entries found.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table data-table--stage2">
                        <thead>
                          <tr>
                            <th>Coin</th>
                            <th>Trade ID</th>
                            <th>Entry Price</th>
                            <th>Peak Price</th>
                            <th>Exit Price</th>
                            <th>User Strategy</th>
                            <th>Trader Strategy</th>
                            <th>Status</th>
                            <th>Wallet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coinRows.map((coin) => (
                            <tr key={coin.rowId}>
                              <td><strong>{coin.coinName || "—"}</strong></td>
                              <td style={{ maxWidth: 220, overflowWrap: "anywhere" }}>{coin.tradeId}</td>
                              <td>{formatPrice(coin.entryPrice)}</td>
                              <td>{formatPrice(coin.peakPrice)}</td>
                              <td>{formatPrice(coin.exitPrice)}</td>
                              <td>{formatStrategy(coin.userStrategyPL ?? coin.userStrategy)}</td>
                              <td>{formatStrategy(coin.traderStrategyPL ?? coin.traderStrategy)}</td>
                              <td>{coin.walletStatus}</td>
                              <td>
                                {coin.walletId ? (
                                  <Link to={`/wallets/${coin.walletId}`} className="btn btn--small btn--ghost">View wallet</Link>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <p className="stage2-strategy-stats-note">
          Below 0 means negative; 0 means exactly zero; 0–50 means above 0 through 50;
          51–100 means above 50 through 100; Above 100 means greater than 100.
          Each coin is counted once in each strategy distribution when its value is available.
        </p>
      </section>

      <div style={{ marginTop: 18 }}>
        <Link to="/wallets?status=Pending%20Stage%202" className="btn btn--ghost">
          View Stage 2 wallets and coin details →
        </Link>
      </div>
    </div>
  );
}
