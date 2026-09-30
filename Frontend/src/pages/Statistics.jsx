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

function getStage2Items(wallet) {
  if (Array.isArray(wallet?.stage2Items) && wallet.stage2Items.length) {
    return wallet.stage2Items;
  }
  if (wallet?.coinName) {
    return [{
      _id: wallet._id || wallet.id,
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

function getStrategyValue(item, kind) {
  const raw = kind === "user"
    ? (item?.userStrategyPL ?? item?.userStrategy ?? item?.userStrategyPercent)
    : (item?.traderStrategyPL ?? item?.traderStrategy ?? item?.traderStrategyPercent);
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function makeDistribution(items, kind) {
  const counts = { below0: 0, zero: 0, "0to50": 0, "51to100": 0, above100: 0 };
  items.forEach((item) => {
    const value = getStrategyValue(item, kind);
    if (value === null) return;
    if (value < 0) counts.below0 += 1;
    else if (value === 0) counts.zero += 1;
    else if (value <= 50) counts["0to50"] += 1;
    else if (value <= 100) counts["51to100"] += 1;
    else counts.above100 += 1;
  });
  return counts;
}

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

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { maximumFractionDigits: 8 })
    : String(value);
}

function formatStrategy(value) {
  if (value === null || value === undefined || value === "") return "Pending";
  const number = Number(value);
  return Number.isFinite(number) ? `${number > 0 ? "+" : ""}${number.toFixed(2)}%` : String(value);
}

function walletKey(wallet) {
  return String(wallet?._id || wallet?.id || wallet?.tradeId || wallet?.tradeIdNormalized || "wallet");
}

function getTradeId(wallet) {
  return wallet?.tradeId || wallet?.tradeIdNormalized || wallet?.traderId || "Trade ID unavailable";
}

export default function Statistics() {
  const { getWallets } = useData();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch wallets whose current workflow stage is Stage 2. Each wallet/trade ID
      // gets its own card and its own coin distribution; there are no global totals.
      const response = await getWallets("stage=2&limit=500&page=1");
      const result = Array.isArray(response?.wallets)
        ? response.wallets
        : Array.isArray(response?.data?.wallets)
          ? response.data.wallets
          : [];
      setWallets(result);
      setExpandedId((current) => result.some((wallet) => walletKey(wallet) === current) ? current : "");
    } catch (err) {
      setError(err?.message || "Unable to load Stage 2 trade IDs.");
    } finally {
      setLoading(false);
    }
  }, [getWallets]);

  useEffect(() => { load(); }, [load]);

  const tradeCards = useMemo(() => wallets.map((wallet) => {
    const items = getStage2Items(wallet);
    return {
      wallet,
      id: walletKey(wallet),
      tradeId: getTradeId(wallet),
      items,
      userStats: makeDistribution(items, "user"),
      traderStats: makeDistribution(items, "trader"),
      owner: wallet.userName || wallet.createdByName || wallet.ownerName || wallet.createdBy?.name || "—",
    };
  }), [wallets]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Stage 2 Statistics</h1>
          <p className="page__subtitle">
            Each Trade ID has its own coin count, strategy distribution, and coin details. Select View to inspect that Trade ID only.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? (
        <div className="empty-state">Loading Stage 2 Trade IDs…</div>
      ) : tradeCards.length === 0 ? (
        <div className="empty-state">No wallets are currently in Stage 2.</div>
      ) : (
        <div className="stage2-wallet-stats-list">
          {tradeCards.map((card) => {
            const expanded = expandedId === card.id;
            return (
              <section className="stage2-strategy-stats-panel" key={card.id}>
                <div className="stage2-wallet-stats-card-header">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="stage2-strategy-stats-eyebrow">TRADE ID</span>
                    <h2 style={{ overflowWrap: "anywhere" }}>{card.tradeId}</h2>
                    <p className="page__hint" style={{ marginTop: 6 }}>Created by: {card.owner}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div className="stage2-strategy-stats-total">
                      <span>Total coin entries</span>
                      <strong>{card.items.length}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--small"
                      onClick={() => setExpandedId(expanded ? "" : card.id)}
                      aria-expanded={expanded}
                    >
                      {expanded ? "Hide details" : "View coins & statistics"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ margin: "0 0 12px" }}>Strategy distribution for this Trade ID</h3>
                    <StatRow label="User Strategy" values={card.userStats} />
                    <StatRow label="Trader Strategy" values={card.traderStats} />
                    <p className="stage2-strategy-stats-note">
                      Below 0 means negative; 0 means exactly zero; 0–50 means above 0 through 50;
                      51–100 means above 50 through 100; Above 100 means greater than 100.
                      Counts include only coin entries with a recorded strategy value.
                    </p>

                    <div className="panel__header" style={{ margin: "18px 0 12px" }}>
                      <div>
                        <h3 className="panel__title">Coin details</h3>
                        <p className="page__hint">{card.items.length} {card.items.length === 1 ? "coin" : "coins"} under this Trade ID</p>
                      </div>
                      {(card.wallet?._id || card.wallet?.id) && (
                        <Link to={`/wallets/${card.wallet._id || card.wallet.id}`} className="btn btn--ghost btn--small">Open wallet</Link>
                      )}
                    </div>

                    {card.items.length === 0 ? (
                      <div className="empty-state">No coin details have been submitted for this Trade ID yet.</div>
                    ) : (
                      <div className="table-wrap">
                        <table className="data-table data-table--stage2">
                          <thead>
                            <tr>
                              <th>Coin</th>
                              <th>Entry Price</th>
                              <th>Peak Price</th>
                              <th>Exit Price</th>
                              <th>User Strategy</th>
                              <th>Trader Strategy</th>
                              <th>Coin Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.items.map((coin, index) => (
                              <tr key={String(coin?._id || `${card.id}-coin-${index}`)}>
                                <td><strong>{coin?.coinName || "—"}</strong></td>
                                <td>{formatPrice(coin?.entryPrice)}</td>
                                <td>{formatPrice(coin?.peakPrice)}</td>
                                <td>{formatPrice(coin?.exitPrice)}</td>
                                <td>{formatStrategy(coin?.userStrategyPL ?? coin?.userStrategy ?? coin?.userStrategyPercent)}</td>
                                <td>{formatStrategy(coin?.traderStrategyPL ?? coin?.traderStrategy ?? coin?.traderStrategyPercent)}</td>
                                <td>{coin?.status || card.wallet?.status || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
