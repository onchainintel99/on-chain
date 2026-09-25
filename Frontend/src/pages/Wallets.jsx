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
              {wallets.length} wallet
              {wallets.length === 1
                ? ""
                : "s"}
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading wallets...
          </div>

        ) : (

          <div className="table-wrap">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Coin
                  </th>

                  <th>
                    Trade ID
                  </th>

                  <th>
                    Created By
                  </th>

                  <th>
                    Stage
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Updated
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {wallets.map(
                  (wallet) => (

                    <tr
                      key={
                        wallet.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            wallet.coinName
                          }
                        </strong>
                      </td>


                      <td className="mono-cell">
                        {
                          wallet.tradeId
                        }
                      </td>


                      <td>

                        <strong>
                          {
                            wallet.userName
                          }
                        </strong>

                        <div className="table-sub">
                          {
                            wallet.creatorRole
                          }
                        </div>

                      </td>


                      <td>
                        <span className="badge">
                          Stage{" "}
                          {
                            wallet.stage
                          }
                        </span>
                      </td>


                      <td>
                        <Badge
                          status={
                            wallet.status
                          }
                        />
                      </td>


                      <td>
                        {formatDateTime(
                          wallet.lastUpdated
                        )}
                      </td>


                      <td>

                        <Link
                          to={`/wallets/${wallet.id}`}
                          className="btn btn--small btn--primary"
                        >
                          View
                        </Link>

                      </td>

                    </tr>

                  )
                )}


                {!wallets.length && (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-row"
                    >
                      No wallets found
                      in this stage.
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