import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../lib/store";
import "../leaderboard.css";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "last30", label: "Last 30 days" },
  { key: "last90", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatRate(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(1)}%`;
}

function rankClass(index) {
  if (index === 0) return "leaderboard-rank-badge leaderboard-rank-badge--gold";
  if (index === 1) return "leaderboard-rank-badge leaderboard-rank-badge--silver";
  if (index === 2) return "leaderboard-rank-badge leaderboard-rank-badge--bronze";
  return "leaderboard-rank-badge";
}

function StatCard({ label, value, tone = "blue", icon }) {
  return (
    <article className={`lb-stat lb-stat--${tone}`}>
      <div className="lb-stat__top">
        <span className="lb-stat__label">{label}</span>
        <span className="lb-stat__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <strong className="lb-stat__value">{value ?? 0}</strong>
    </article>
  );
}

export default function Leaderboard() {
  const { getLeaderboard } = useData();

  const [range, setRange] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadLeaderboard(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await getLeaderboard(range);
      setData(response);
    } catch (err) {
      setError(err?.message || "Unable to load leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, [range]);

  const overview = data?.overview || {};

  // Supports both the current backend key (`researchers`) and
  // the earlier frontend key (`leaderboard`).
  const researchers = useMemo(
    () => data?.researchers ?? data?.leaderboard ?? [],
    [data]
  );

  const topThree = researchers.slice(0, 3);
  const totalResearchers =
    overview.totalResearchers ?? researchers.length ?? 0;

  return (
    <div className="page leaderboard-page">
      <header className="lb-hero">
        <div className="lb-hero__content">
          <div className="lb-eyebrow">
            <span className="lb-eyebrow__dot" />
            ONCHAIN INTELLIGENCE
          </div>

          <h1 className="lb-title">Top Researchers</h1>

          <p className="lb-subtitle">
            Track researcher performance across the complete wallet approval
            pipeline. Rankings are driven by successfully approved wallets.
          </p>

          <div className="lb-meta">
            <span className="lb-meta__item">
              <strong>{totalResearchers}</strong> researchers
            </span>
            <span className="lb-meta__divider" />
            <span className="lb-meta__item">
              <strong>{overview.successful ?? 0}</strong> successful wallets
            </span>
          </div>
        </div>

        <button
          type="button"
          className="lb-refresh"
          onClick={() => loadLeaderboard(true)}
          disabled={loading || refreshing}
        >
          <span className={refreshing ? "lb-refresh__spin" : ""}>↻</span>
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <section className="lb-filter-bar" aria-label="Leaderboard time range">
        <div className="lb-filter-heading">
          <span className="lb-filter-heading__title">Performance period</span>
          <span className="lb-filter-heading__value">
            {RANGES.find((item) => item.key === range)?.label}
          </span>
        </div>

        <div className="lb-range-list">
          {RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lb-range ${
                range === item.key ? "lb-range--active" : ""
              }`}
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="lb-error" role="alert">
          <span className="lb-error__icon">!</span>
          <div>
            <strong>Could not load leaderboard</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => loadLeaderboard()}>
            Retry
          </button>
        </div>
      )}

      <section className="lb-stats-grid">
        <StatCard
          label="Total wallets"
          value={overview.totalWallets ?? overview.total ?? 0}
          tone="blue"
          icon="◈"
        />
        <StatCard
          label="Stage 1"
          value={overview.stage1 ?? 0}
          tone="amber"
          icon="01"
        />
        <StatCard
          label="Stage 2"
          value={overview.stage2 ?? 0}
          tone="amber"
          icon="02"
        />
        <StatCard
          label="Stage 3"
          value={overview.stage3 ?? 0}
          tone="amber"
          icon="03"
        />
        <StatCard
          label="Pending approval"
          value={overview.pendingApproval ?? 0}
          tone="violet"
          icon="!"
        />
        <StatCard
          label="Successful"
          value={overview.successful ?? 0}
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Rejected"
          value={overview.rejected ?? overview.failed ?? 0}
          tone="red"
          icon="×"
        />
      </section>

      {topThree.length > 0 && (
        <section className="lb-podium-section">
          <div className="lb-section-heading">
            <div>
              <span className="lb-section-kicker">LEADING PERFORMANCE</span>
              <h2>Top performers</h2>
            </div>
            <span className="lb-section-note">Successful wallets</span>
          </div>

          <div className="lb-podium">
            {topThree.map((researcher, index) => (
              <article
                key={researcher.id}
                className={`lb-podium-card lb-podium-card--${index + 1}`}
              >
                <div className={rankClass(index)}>
                  {index + 1}
                </div>

                <div className="lb-podium-avatar">
                  {initials(researcher.name)}
                </div>

                <h3>{researcher.name || "Unnamed researcher"}</h3>

                <p>{researcher.email || "Researcher account"}</p>

                <div className="lb-podium-success">
                  <strong>{researcher.successful ?? 0}</strong>
                  <span>successful</span>
                </div>

                <div className="lb-podium-metrics">
                  <span>
                    <strong>{researcher.walletsAdded ?? 0}</strong>
                    Added
                  </span>
                  <span>
                    <strong>{researcher.stage2 ?? 0}</strong>
                    Stage 2
                  </span>
                  <span>
                    <strong>{researcher.stage3 ?? 0}</strong>
                    Stage 3
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="lb-table-card">
        <div className="lb-table-header">
          <div>
            <span className="lb-section-kicker">TEAM RANKING</span>
            <h2>Researcher leaderboard</h2>
            <p>
              Successful approvals are the primary ranking metric, with
              pipeline progress used as the tie-breaker.
            </p>
          </div>

          <div className="lb-user-count">
            <strong>{researchers.length}</strong>
            <span>researchers</span>
          </div>
        </div>

        <div className="lb-table-scroll">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Researcher</th>
                <th>Wallets added</th>
                <th>Stage 2</th>
                <th>Stage 3</th>
                <th>Successful</th>
                <th>Success rate</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="lb-empty">
                    <div className="lb-loading">
                      <span className="lb-loading__spinner" />
                      Loading researcher performance…
                    </div>
                  </td>
                </tr>
              ) : researchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="lb-empty">
                    <div className="lb-empty-state">
                      <div className="lb-empty-state__icon">◈</div>
                      <strong>No researcher activity yet</strong>
                      <span>
                        Normal user accounts and their wallet activity will
                        appear here automatically.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                researchers.map((researcher, index) => (
                  <tr key={researcher.id || `${researcher.email}-${index}`}>
                    <td>
                      <span className={rankClass(index)}>
                        {index + 1}
                      </span>
                    </td>

                    <td>
                      <div className="lb-researcher">
                        <span className="lb-avatar">
                          {initials(researcher.name)}
                        </span>

                        <span className="lb-researcher__info">
                          <strong>
                            {researcher.name || "Unnamed researcher"}
                          </strong>
                          <small>{researcher.email || "—"}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="lb-number">
                        {researcher.walletsAdded ?? 0}
                      </span>
                    </td>

                    <td>
                      <span className="lb-number">
                        {researcher.stage2 ?? 0}
                      </span>
                    </td>

                    <td>
                      <span className="lb-number">
                        {researcher.stage3 ?? 0}
                      </span>
                    </td>

                    <td>
                      <span className="lb-success-pill">
                        {researcher.successful ?? 0}
                      </span>
                    </td>

                    <td>
                      <div className="lb-rate">
                        <span>{formatRate(researcher.successRate)}</span>
                        <div className="lb-rate__track">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(researcher.successRate || 0))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}