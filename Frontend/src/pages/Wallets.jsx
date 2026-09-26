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

import Badge
  from "../components/Badge";

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


/* =========================================================
   STAGE 2 STRATEGY RANGES

   0            = exactly 0%
   0–50         = greater than 0% and up to 50%
   50–100       = greater than 50% and up to 100%
   Above 100    = greater than 100%

   "All" keeps every Stage 2 wallet visible.
========================================================= */

const STRATEGY_RANGES = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "zero",
    label: "0",
  },
  {
    key: "0-50",
    label: "0–50",
  },
  {
    key: "50-100",
    label: "50–100",
  },
  {
    key: "above-100",
    label: "Above 100",
  },
];


function matchesStrategyRange(
  value,
  range
) {
  if (range === "all") {
    return true;
  }

  const number =
    Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(number)
  ) {
    return false;
  }

  if (range === "zero") {
    return number === 0;
  }

  if (range === "0-50") {
    return number > 0 && number <= 50;
  }

  if (range === "50-100") {
    return number > 50 && number <= 100;
  }

  if (range === "above-100") {
    return number > 100;
  }

  return true;
}


export default function Wallets() {
  const {
    getWallets,
    currentUser,
  } = useData();


  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const initialStatus =
    searchParams.get(
      "status"
    ) || "All";


  const [
    status,
    setStatus,
  ] = useState(
    STATUS_OPTIONS.includes(
      initialStatus
    )
      ? initialStatus
      : "All"
  );


  const [
    wallets,
    setWallets,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  /*
   * Stage 2 strategy filters.
   *
   * These are client-side filters because the Stage 2
   * table already loads the complete Stage 2 dataset.
   */

  const [
    userStrategyRange,
    setUserStrategyRange,
  ] = useState("all");


  const [
    traderStrategyRange,
    setTraderStrategyRange,
  ] = useState("all");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  async function load() {
    try {
      setError("");
      setLoading(true);


      const params =
        new URLSearchParams();


      if (
        status !== "All"
      ) {
        params.set(
          "status",
          status
        );
      }


      if (
        search.trim()
      ) {
        params.set(
          "search",
          search.trim()
        );
      }


      params.set(
        "limit",
        "200"
      );


      const response =
        await getWallets(
          params.toString()
        );


      setWallets(
        response.wallets ||
          []
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    load();


    const interval =
      setInterval(
        load,
        5000
      );


    return () =>
      clearInterval(
        interval
      );
  }, [
    status,
    search,
  ]);


  function changeStatus(
    value
  ) {
    setStatus(value);


    if (
      value === "All"
    ) {
      setSearchParams(
        {}
      );
    } else {
      setSearchParams({
        status: value,
      });
    }
  }


  const title =
    status === "All"
      ? "Wallet Pipeline"
      : status;

  const isStage2 =
    status === "Pending Stage 2";


  /*
   * =======================================================
   * FILTERED STAGE 2 WALLETS
   *
   * Both strategy filters are applied together.
   *
   * Example:
   *
   * User Strategy = 0–50
   * Trader Strategy = 50–100
   *
   * Only wallets matching BOTH ranges remain visible.
   * =======================================================
   */

  const visibleWallets =
    useMemo(() => {
      if (!isStage2) {
        return wallets;
      }

      return wallets.filter(
        (wallet) => {
          const userPL =
            wallet.userStrategyPL ??
            wallet.userStrategy;

          const traderPL =
            wallet.traderStrategyPL ??
            wallet.traderStrategy;

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
        }
      );
    }, [
      wallets,
      isStage2,
      userStrategyRange,
      traderStrategyRange,
    ]);


  function resetStrategyFilters() {
    setUserStrategyRange("all");
    setTraderStrategyRange("all");
  }


  return (
    <div className="page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page__header">

        <div>

          <h1 className="page__title">
            {title}
          </h1>

          <p className="page__subtitle">
            All wallets available to{" "}
            {currentUser?.role ===
            "user"
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


      {/* =================================================
          PIPELINE NAV
      ================================================= */}

      <section className="panel">

        <div className="pipeline pipeline--compact">

          {STATUS_OPTIONS.map(
            (
              item,
              index
            ) => {

              const label =
                item === "All"
                  ? "All"
                  : item.replace(
                      "Pending ",
                      ""
                    );


              return (
                <React.Fragment
                  key={item}
                >

                  <button
                    type="button"
                    className={`pipeline-filter ${
                      status === item
                        ? "pipeline-filter--active"
                        : ""
                    }`}
                    onClick={() =>
                      changeStatus(
                        item
                      )
                    }
                  >
                    {label}
                  </button>


                  {index <
                    STATUS_OPTIONS.length -
                      1 && (
                    <span className="pipeline-arrow">
                      →
                    </span>
                  )}

                </React.Fragment>
              );
            }
          )}

        </div>

      </section>


      {/* =================================================
          STAGE 2 STRATEGY FILTERS
      ================================================= */}

      {isStage2 && (
        <section className="stage2-strategy-filter-panel">

          {/* USER STRATEGY */}

          <div className="stage2-strategy-filter-row">

            <div className="stage2-strategy-filter-heading">

              <span className="stage2-strategy-filter-title">
                User Strategy
              </span>

              <span className="stage2-strategy-filter-value">
                {
                  STRATEGY_RANGES.find(
                    (item) =>
                      item.key ===
                      userStrategyRange
                  )?.label
                }
              </span>

            </div>


            <div
              className="stage2-strategy-range-list"
              aria-label="User Strategy range"
            >

              {STRATEGY_RANGES.map(
                (item) => (
                  <button
                    key={`user-${item.key}`}
                    type="button"
                    className={`stage2-strategy-range ${
                      userStrategyRange ===
                      item.key
                        ? "stage2-strategy-range--active"
                        : ""
                    }`}
                    onClick={() =>
                      setUserStrategyRange(
                        item.key
                      )
                    }
                  >
                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>


          {/* TRADER STRATEGY */}

          <div className="stage2-strategy-filter-row">

            <div className="stage2-strategy-filter-heading">

              <span className="stage2-strategy-filter-title">
                Trader Strategy
              </span>

              <span className="stage2-strategy-filter-value">
                {
                  STRATEGY_RANGES.find(
                    (item) =>
                      item.key ===
                      traderStrategyRange
                  )?.label
                }
              </span>

            </div>


            <div
              className="stage2-strategy-range-list"
              aria-label="Trader Strategy range"
            >

              {STRATEGY_RANGES.map(
                (item) => (
                  <button
                    key={`trader-${item.key}`}
                    type="button"
                    className={`stage2-strategy-range ${
                      traderStrategyRange ===
                      item.key
                        ? "stage2-strategy-range--active"
                        : ""
                    }`}
                    onClick={() =>
                      setTraderStrategyRange(
                        item.key
                      )
                    }
                  >
                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>


          {/* FILTER SUMMARY */}

          <div className="stage2-strategy-filter-footer">

            <span>
              Showing{" "}
              <strong>
                {visibleWallets.length}
              </strong>{" "}
              of{" "}
              <strong>
                {wallets.length}
              </strong>{" "}
              Stage 2 wallets
            </span>

            {(userStrategyRange !== "all" ||
              traderStrategyRange !== "all") && (
              <button
                type="button"
                className="stage2-strategy-clear"
                onClick={
                  resetStrategyFilters
                }
              >
                Clear filters
              </button>
            )}

          </div>

        </section>
      )}


      {/* =================================================
          SEARCH
      ================================================= */}

      <section className="panel">

        <div className="wallet-toolbar">

          <input
            className="field__input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search coin name or Trade ID..."
          />


          <select
            className="field__input"
            value={status}
            onChange={(e) =>
              changeStatus(
                e.target.value
              )
            }
          >

            {STATUS_OPTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

          </select>

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}


      {/* =================================================
          WALLET TABLE
      ================================================= */}

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
                ? `${visibleWallets.length} of ${wallets.length} wallets`
                : `${wallets.length} wallet${
                    wallets.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading wallets...
          </div>

        ) : (

          <div className="table-wrap">

            <table className={`data-table ${
              isStage2
                ? "data-table--stage2"
                : ""
            }`}>

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

                {visibleWallets.map(
                  (wallet) => {
                    const userPL =
                      wallet.userStrategyPL;

                    const traderPL =
                      wallet.traderStrategyPL;

                    return (
                      <tr
                        key={wallet.id}
                      >

                        <td>
                          <strong>
                            {wallet.coinName}
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
                                {wallet.creatorRole || "user"}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <strong>
                                {wallet.userName}
                              </strong>
                              <div className="table-sub">
                                {wallet.creatorRole}
                              </div>
                            </td>

                            <td>
                              <span className="badge">
                                Stage {wallet.stage}
                              </span>
                            </td>

                            <td>
                              <Badge
                                status={wallet.status}
                              />
                            </td>

                            <td>
                              {formatDateTime(
                                wallet.lastUpdated
                              )}
                            </td>
                          </>
                        )}


                        <td>
                          <Link
                            to={`/wallets/${wallet.id}`}
                            className="btn btn--small btn--primary"
                          >
                            View
                          </Link>
                        </td>

                      </tr>
                    );
                  }
                )}


                {!visibleWallets.length && (
                  <tr>
                    <td
                      colSpan={isStage2 ? 9 : 7}
                      className="empty-row"
                    >
                      {isStage2
                        ? (
                            wallets.length
                              ? "No Stage 2 wallets match the selected strategy ranges."
                              : "No wallets are currently waiting for Stage 2."
                          )
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