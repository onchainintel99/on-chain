import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { useData } from "../lib/store";

const STAGES = [
  {
    number: 1,
    label: "Stage 1",
    description: "Initial wallet review",
    status: "Pending Stage 1",
  },

  {
    number: 2,
    label: "Stage 2",
    description: "CP / SP verification",
    status: "Pending Stage 2",
  },

  {
    number: 3,
    label: "Stage 3",
    description: "Final Admin approval",
    status: "Pending Stage 3",
  },

  {
    number: 4,
    label: "Successful",
    description: "Final approval completed",
    status: "Successful",
  },
];

export default function Dashboard() {
  const {
    currentUser,
    getOverview,
  } = useData();

  const [overview, setOverview] =
    useState(null);

  const [error, setError] =
    useState("");

  async function load() {
    try {
      const response =
        await getOverview();

      setOverview(
        response.overview
      );

      setError("");
    } catch (err) {
      setError(
        err.message
      );
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
  }, []);

  const data =
    overview || {};

  const getCount =
    (status) => {
      if (
        status ===
        "Pending Stage 1"
      ) {
        return data.stage1 || 0;
      }

      if (
        status ===
        "Pending Stage 2"
      ) {
        return data.stage2 || 0;
      }

      if (
        status ===
        "Pending Stage 3"
      ) {
        return data.stage3 || 0;
      }

      return data.successful || 0;
    };

  /*
   * ONLY USER CAN CREATE WALLET
   */

  const canCreateWallet =
    currentUser?.role ===
    "user";

  return (
    <div className="page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page__header">

        <div>

          <p className="page__eyebrow">
            ONCHAIN INTELLIGENCE
          </p>

          <h1 className="page__title">
            Welcome,{" "}
            {currentUser?.name}
          </h1>

          <p className="page__subtitle">
            Monitor wallets and move
            them through the approval
            pipeline.
          </p>

        </div>

        {/* =================================================
            ONLY USER GETS ADD WALLET
        ================================================= */}

        {canCreateWallet && (
          <Link
            to="/create-wallet"
            className="btn btn--primary"
          >
            + Add Wallet
          </Link>
        )}

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="stat-grid">

        <div className="stat-card">

          <div className="stat-card__label">
            Total Wallets
          </div>

          <div className="stat-card__value">
            {data.total || 0}
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card__label">
            Stage 1
          </div>

          <div className="stat-card__value">
            {data.stage1 || 0}
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card__label">
            Stage 2
          </div>

          <div className="stat-card__value">
            {data.stage2 || 0}
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card__label">
            Stage 3
          </div>

          <div className="stat-card__value">
            {data.stage3 || 0}
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card__label">
            Successful
          </div>

          <div className="stat-card__value">
            {data.successful || 0}
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card__label">
            Failed
          </div>

          <div className="stat-card__value">
            {data.failed || 0}
          </div>

        </div>

      </section>

      {/* =================================================
          PIPELINE
      ================================================= */}

      <section className="panel pipeline-panel">

        <div className="panel__header">

          <div>

            <h2 className="panel__title">
              Wallet Approval Pipeline
            </h2>

            <p className="page__hint">
              Click any stage to view the
              wallets currently inside it.
            </p>

          </div>

        </div>

        <div className="pipeline">

          {STAGES.map(
            (stage, index) => (

              <React.Fragment
                key={
                  stage.number
                }
              >

                <Link
                  to={
                    stage.number === 4
                      ? "/wallets?status=Successful"
                      : `/wallets?status=${encodeURIComponent(
                          stage.status
                        )}`
                  }
                  className={`pipeline-step ${
                    stage.number === 4
                      ? "pipeline-step--success"
                      : ""
                  }`}
                >

                  <div className="pipeline-step__number">
                    {stage.number}
                  </div>

                  <div className="pipeline-step__content">

                    <strong>
                      {stage.label}
                    </strong>

                    <span>
                      {stage.description}
                    </span>

                    <b>
                      {getCount(
                        stage.status
                      )}
                    </b>

                  </div>

                </Link>

                {index <
                  STAGES.length - 1 && (
                  <div className="pipeline-arrow">
                    →
                  </div>
                )}

              </React.Fragment>
            )
          )}

        </div>

      </section>

      {/* =================================================
          PERMISSIONS
      ================================================= */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Approval permissions
          </h2>

        </div>

        <div className="permission-grid">

          <div className="permission-card">

            <strong>
              Stage 1
            </strong>

            <span>
              Manager 1, Manager 2
              and Admin can approve.
            </span>

          </div>

          <div className="permission-card">

            <strong>
              Stage 2
            </strong>

            <span>
              Manager 1, Manager 2
              and Admin can approve.
            </span>

          </div>

          <div className="permission-card permission-card--admin">

            <strong>
              Stage 3
            </strong>

            <span>
              Only Admin can perform
              the final approval.
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}