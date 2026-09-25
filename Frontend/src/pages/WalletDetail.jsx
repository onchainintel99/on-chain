import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useData,
} from "../lib/store";

import Badge
  from "../components/Badge";

import {
  formatDateTime,
} from "../lib/utils";


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


  const [
    wallet,
    setWallet,
  ] = useState(null);


  const [
    note,
    setNote,
  ] = useState("");


  const [
    costPrice,
    setCostPrice,
  ] = useState("");


  const [
    soldPrice,
    setSoldPrice,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* =========================================================
     LOAD
  ========================================================= */

  async function loadWallet() {
    try {
      setError("");

      const response =
        await getWallet(id);

      setWallet(
        response.wallet
      );
    } catch (err) {
      setError(
        err.message
      );
    }
  }


  useEffect(() => {
    loadWallet();
  }, [id]);


  /* =========================================================
     STAGE 1
  ========================================================= */

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
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     STAGE 2 SUBMIT
  ========================================================= */

  async function handleStage2Submit(
    event
  ) {
    event.preventDefault();

    setError("");


    if (
      costPrice === "" ||
      soldPrice === ""
    ) {
      setError(
        "Cost Price and Sold Price are required."
      );

      return;
    }


    const cost =
      Number(costPrice);

    const sold =
      Number(soldPrice);


    if (
      !Number.isFinite(cost) ||
      cost < 0 ||
      !Number.isFinite(sold) ||
      sold < 0
    ) {
      setError(
        "Enter valid CP and SP values."
      );

      return;
    }


    setLoading(true);


    try {
      const response =
        await submitStage2(
          id,
          {
            costPrice: cost,
            soldPrice: sold,
          }
        );


      setWallet(
        response.wallet
      );

      setCostPrice("");
      setSoldPrice("");
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     STAGE 2 APPROVAL
  ========================================================= */

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
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     STAGE 3 ADMIN
  ========================================================= */

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
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


  if (!wallet) {
    return (
      <div className="page">

        <p>
          {error ||
            "Loading wallet..."}
        </p>

      </div>
    );
  }


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


  const isOwner =
    wallet.userId ===
    currentUser?.id;


  /*
   * ONLY the normal user who created the wallet
   * enters CP / SP during Stage 2.
   *
   * Managers and Admin can approve/reject Stage 2
   * after the user submits both values.
   */
  const showStage2Form =
    role === "user" &&
    isOwner &&
    wallet.status ===
      "Pending Stage 2" &&
    wallet.costPrice ==
      null &&
    wallet.soldPrice ==
      null;


  const showStage1Actions =
    canApprove &&
    wallet.status ===
      "Pending Stage 1";


  const showStage2Actions =
    canApprove &&
    wallet.status ===
      "Pending Stage 2" &&
    wallet.costPrice !=
      null &&
    wallet.soldPrice !=
      null;


  const showStage3Actions =
    isAdmin &&
    wallet.status ===
      "Pending Stage 3";


  return (
    <div className="page">

      <Link
        to="/wallets"
        className="link link--back"
      >
        ← Back to pipeline
      </Link>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page__header">

        <div>

          <p className="page__eyebrow">
            WALLET DETAILS
          </p>

          <h1 className="page__title">
            {wallet.coinName}
          </h1>

          <p className="page__subtitle mono-cell">
            Trade ID:{" "}
            {wallet.tradeId}
            {" · "}
            Created by{" "}
            {wallet.userName}
          </p>

        </div>


        <Badge
          status={
            wallet.status
          }
        />

      </div>


      {/* =================================================
          VISUAL PIPELINE
      ================================================= */}

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
              arr
            ) => (

              <React.Fragment
                key={
                  item.number
                }
              >

                <div
                  className={`pipeline-step ${
                    wallet.stage >=
                      item.number ||
                    (
                      item.number ===
                        4 &&
                      wallet.status ===
                        "Successful"
                    )
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
                  arr.length - 1 && (
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
          DETAILS
      ================================================= */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Wallet information
          </h2>

        </div>


        <dl className="detail-list">

          <div className="detail-list__row">

            <dt>
              Coin Name
            </dt>

            <dd>
              {wallet.coinName}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Trade ID
            </dt>

            <dd className="mono-cell">
              {wallet.tradeId}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Created By
            </dt>

            <dd>
              {wallet.userName}
              {" "}
              ({wallet.creatorRole})
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Current Stage
            </dt>

            <dd>
              Stage{" "}
              {wallet.stage}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Cost Price
            </dt>

            <dd>
              {wallet.costPrice ??
                "Not submitted"}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Sold Price
            </dt>

            <dd>
              {wallet.soldPrice ??
                "Not submitted"}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Stage 1 Approved By
            </dt>

            <dd>
              {wallet.stage1ReviewedBy ||
                "Pending"}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Stage 2 Approved By
            </dt>

            <dd>
              {wallet.stage2ReviewedBy ||
                "Pending"}
            </dd>

          </div>


          <div className="detail-list__row">

            <dt>
              Final Admin Approved By
            </dt>

            <dd>
              {wallet.stage3ReviewedBy ||
                "Pending"}
            </dd>

          </div>

        </dl>

      </section>


      {/* =================================================
          STAGE 1 ACTION
      ================================================= */}

      {showStage1Actions && (

        <section className="panel">

          <div className="panel__header">

            <div>

              <h2 className="panel__title">
                Stage 1 Approval
              </h2>

              <p className="page__hint">
                Manager 1, Manager 2
                and Admin can approve
                or reject this stage.
              </p>

            </div>

          </div>


          <textarea
            className="field__input field__textarea"
            rows="3"
            placeholder="Optional approval note"
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
          />


          <div className="action-block__buttons">

            <button
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


      {/* =================================================
          STAGE 2 FORM
      ================================================= */}

      {showStage2Form && (

        <section className="stage2-details-card">

          {/* HEADER */}
          <div className="stage2-details-header">

            <div>
              <h2>
                Stage 2 Details
              </h2>

              <p>
                Enter the Cost Price and Sold Price before Stage 2 approval.
              </p>
            </div>

            <span className="stage2-badge">
              Stage 2
            </span>

          </div>


          {/* FORM */}
          <form
            className="stage2-form"
            onSubmit={handleStage2Submit}
          >

            <div className="stage2-fields">

              {/* COST PRICE */}
              <label className="stage2-field">

                <span>
                  Cost Price <strong>*</strong>
                </span>

                <div className="stage2-input-wrap">

                  <span className="stage2-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) =>
                      setCostPrice(e.target.value)
                    }
                    placeholder="0.00"
                    className="stage2-input"
                    required
                  />

                </div>

              </label>


              {/* SOLD PRICE */}
              <label className="stage2-field">

                <span>
                  Sold Price <strong>*</strong>
                </span>

                <div className="stage2-input-wrap">

                  <span className="stage2-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={soldPrice}
                    onChange={(e) =>
                      setSoldPrice(e.target.value)
                    }
                    placeholder="0.00"
                    className="stage2-input"
                    required
                  />

                </div>

              </label>


              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="stage2-submit-btn"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="stage2-spinner" />
                    <span>
                      Submitting...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Submit Stage 2
                    </span>

                    <span className="stage2-submit-arrow">
                      →
                    </span>
                  </>
                )}

              </button>

            </div>

          </form>

        </section>

      )}


      {/* =================================================
          STAGE 3 ADMIN FINAL
      ================================================= */}

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
              required before the
              wallet becomes Successful.
            </p>

          </div>


          <textarea
            className="field__input field__textarea"
            rows="3"
            placeholder="Optional final approval note"
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
          />


          <div className="action-block__buttons">

            <button
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


      {/* =================================================
          STATUS
      ================================================= */}

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
              wallet.costPrice ==
                null &&
              "Stage 1 has passed. Stage 2 details are required."}


            {wallet.status ===
              "Pending Stage 2" &&
              wallet.costPrice !=
                null &&
              "Stage 2 details have been submitted and are waiting for approval."}


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


        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

      </section>


      {/* =================================================
          HISTORY
      ================================================= */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Approval History
          </h2>

        </div>


        <ol className="timeline">

          {[
            ...(wallet.history ||
              []),
          ]
            .reverse()
            .map(
              (item) => (

                <li
                  key={
                    item.id
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

                      <span className="timeline__by">
                        {" "}
                        —{" "}
                        {item.by}
                      </span>

                    </p>


                    <p className="timeline__detail">
                      {
                        item.detail
                      }
                    </p>


                    <p className="timeline__time">
                      {formatDateTime(
                        item.at
                      )}
                    </p>

                  </div>

                </li>

              )
            )}

        </ol>

      </section>

    </div>
  );
}