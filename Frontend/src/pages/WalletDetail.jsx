import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import { useData } from '../lib/store';

import Badge from '../components/Badge';

import { formatDateTime } from '../lib/utils';


const LABELS = {
  created: 'Wallet created',

  stage1_approved:
    'Stage 1 accepted',

  stage1_rejected:
    'Stage 1 rejected',

  stage2_submitted:
    'Stage 2 submitted',

  stage2_approved:
    'Stage 2 accepted',

  stage2_rejected:
    'Stage 2 rejected',

  note: 'Note',
};


export default function WalletDetail() {

  const { id } = useParams();


  const {
    getWallet,
    manager1Decision,
    submitStage2,
    manager2Decision,
    currentUser,
  } = useData();


  // ============================================================
  // WALLET STATE
  // ============================================================

  const [wallet, setWallet] = useState(null);


  // ============================================================
  // STAGE 1 MANAGER NOTE
  // ============================================================

  const [note, setNote] = useState('');


  // ============================================================
  // STAGE 2 FORM
  //
  // IMPORTANT:
  // These start EMPTY.
  //
  // They are NOT populated from wallet.coinName
  // or wallet.tradeId.
  // ============================================================

  const [stage2CoinName, setStage2CoinName] = useState('');

  const [stage2TradeId, setStage2TradeId] = useState('');

  const [costPrice, setCostPrice] = useState('');

  const [soldPrice, setSoldPrice] = useState('');


  // ============================================================
  // UI STATE
  // ============================================================

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);


  // ============================================================
  // LOAD WALLET
  // ============================================================

  async function loadWallet() {

    try {

      setError('');

      const response =
        await getWallet(id);

      setWallet(response.wallet);

    } catch (err) {

      setError(
        err.message || 'Unable to load wallet.'
      );

    }

  }


  useEffect(() => {

    loadWallet();

  }, [id]);


  // ============================================================
  // STAGE 2 SUBMIT
  // ============================================================

  async function handleStage2Submit() {

    setError('');


    // ----------------------------------------------------------
    // Coin name
    // ----------------------------------------------------------

    if (!stage2CoinName.trim()) {

      setError(
        'Please enter the Coin Name.'
      );

      return;

    }


    // ----------------------------------------------------------
    // Trade ID
    // ----------------------------------------------------------

    if (!stage2TradeId.trim()) {

      setError(
        'Please enter the Trade ID.'
      );

      return;

    }


    // ----------------------------------------------------------
    // Cost price
    // ----------------------------------------------------------

    if (!costPrice.trim()) {

      setError(
        'Please enter the Cost Price.'
      );

      return;

    }


    // ----------------------------------------------------------
    // Sold price
    // ----------------------------------------------------------

    if (!soldPrice.trim()) {

      setError(
        'Please enter the Sold Price.'
      );

      return;

    }


    // ----------------------------------------------------------
    // Validate numbers
    // ----------------------------------------------------------

    if (
      Number.isNaN(Number(costPrice)) ||
      Number.isNaN(Number(soldPrice))
    ) {

      setError(
        'Cost Price and Sold Price must be valid numbers.'
      );

      return;

    }


    // ----------------------------------------------------------
    // Negative values
    // ----------------------------------------------------------

    if (
      Number(costPrice) < 0 ||
      Number(soldPrice) < 0
    ) {

      setError(
        'Cost Price and Sold Price cannot be negative.'
      );

      return;

    }


    setLoading(true);


    try {

      // --------------------------------------------------------
      // Send all Stage 2 details
      // --------------------------------------------------------

      const response =
        await submitStage2(
          id,
          {
            coinName:
              stage2CoinName.trim(),

            tradeId:
              stage2TradeId.trim(),

            costPrice:
              Number(costPrice),

            soldPrice:
              Number(soldPrice),
          }
        );


      // --------------------------------------------------------
      // Update wallet
      // --------------------------------------------------------

      setWallet(
        response.wallet
      );


      // --------------------------------------------------------
      // Clear form
      // --------------------------------------------------------

      setStage2CoinName('');

      setStage2TradeId('');

      setCostPrice('');

      setSoldPrice('');


    } catch (err) {

      setError(
        err.message ||
        'Unable to submit Stage 2 details.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ============================================================
  // MANAGER DECISION
  // ============================================================

  async function handleDecision(
    decision
  ) {

    setError('');

    setLoading(true);


    try {

      let response;


      // ========================================================
      // MANAGER STAGE 1
      // ========================================================

      if (
        currentUser.role === 'manager1'
      ) {

        response =
          await manager1Decision(
            id,
            {
              decision,
              note,
            }
          );

      }


      // ========================================================
      // MANAGER STAGE 2
      // ========================================================

      else if (
        currentUser.role === 'manager2'
      ) {

        response =
          await manager2Decision(
            id,
            {
              decision,
              costPrice,
              soldPrice,
              note,
            }
          );

      }


      if (response?.wallet) {

        setWallet(
          response.wallet
        );

      }


      setNote('');


    } catch (err) {

      setError(
        err.message ||
        'Unable to process decision.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ============================================================
  // LOADING
  // ============================================================

  if (!wallet) {

    return (

      <div className="page">

        <p>
          {error || 'Loading wallet...'}
        </p>

      </div>

    );

  }


  // ============================================================
  // ROLES
  // ============================================================

  const isUser =
    currentUser.role === 'user';

  const isManager1 =
    currentUser.role === 'manager1';

  const isManager2 =
    currentUser.role === 'manager2';


  // ============================================================
  // STAGE 2 FORM VISIBILITY
  //
  // The form opens ONLY when:
  //
  // USER
  // +
  // Stage 1 accepted
  // +
  // Pending Stage 2
  // +
  // CP not submitted yet
  // ============================================================

  const showStage2Form =
    isUser &&
    wallet.status === 'Pending Stage 2' &&
    wallet.costPrice == null;


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="page">


      {/* ========================================================
          BACK
      ======================================================== */}

      <Link
        to="/wallets"
        className="link link--back"
      >
        ← Back to wallets
      </Link>


      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="page__header">

        <div>

          <h1 className="page__title">
            {wallet.coinName}
          </h1>

          <p className="page__subtitle mono-cell">

            Trade ID: {wallet.tradeId}

            {' · '}

            Created by {wallet.userName}

          </p>

        </div>


        <Badge
          status={wallet.status}
        />

      </div>


      {/* ========================================================
          DETAIL GRID
      ======================================================== */}

      <div className="detail-grid">


        {/* ======================================================
            WALLET DETAILS
        ====================================================== */}

        <section className="panel">

          <div className="panel__header">

            <h2 className="panel__title">
              Wallet details
            </h2>

          </div>


          <dl className="detail-list">


            {/* Coin */}

            <div className="detail-list__row">

              <dt>
                Coin name
              </dt>

              <dd>
                {wallet.coinName}
              </dd>

            </div>


            {/* Trade */}

            <div className="detail-list__row">

              <dt>
                Trade ID
              </dt>

              <dd className="mono-cell">
                {wallet.tradeId}
              </dd>

            </div>


            {/* User */}

            <div className="detail-list__row">

              <dt>
                User
              </dt>

              <dd>

                {wallet.userName}

                {' '}

                ({wallet.userEmail})

              </dd>

            </div>


            {/* Stage */}

            <div className="detail-list__row">

              <dt>
                Current stage
              </dt>

              <dd>
                Stage {wallet.stage}
              </dd>

            </div>


            {/* Status */}

            <div className="detail-list__row">

              <dt>
                Status
              </dt>

              <dd>

                <Badge
                  status={wallet.status}
                />

              </dd>

            </div>


            {/* Cost price */}

            <div className="detail-list__row">

              <dt>
                Cost price
              </dt>

              <dd>
                {wallet.costPrice ?? '—'}
              </dd>

            </div>


            {/* Sold price */}

            <div className="detail-list__row">

              <dt>
                Sold price
              </dt>

              <dd>
                {wallet.soldPrice ?? '—'}
              </dd>

            </div>


            {/* Created */}

            <div className="detail-list__row">

              <dt>
                Created
              </dt>

              <dd>
                {formatDateTime(
                  wallet.dateAdded
                )}
              </dd>

            </div>

          </dl>


          {/* Notes */}

          {wallet.notes && (

            <>

              <p className="detail-notes__label">
                User notes
              </p>

              <p className="detail-notes__body">
                {wallet.notes}
              </p>

            </>

          )}

        </section>


        {/* ======================================================
            ACTION PANEL
        ====================================================== */}

        <section className="panel">

          <div className="panel__header">

            <h2 className="panel__title">

              {isManager1
                ? 'Stage 1 decision'
                : isManager2
                ? 'Stage 2 review'
                : 'Current status'}

            </h2>

          </div>


          {/* ====================================================
              MANAGER STAGE 1
          ==================================================== */}

          {isManager1 &&
            wallet.status === 'Pending Stage 1' && (

            <>

              <div className="status-callout">

                <strong>
                  Stage 1 review
                </strong>

                <p>
                  Verify this wallet request.
                  Accepting it will move the wallet
                  to Stage 2.
                </p>

              </div>


              <textarea
                className="field__input field__textarea"
                rows="4"
                placeholder="Optional review note"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
              />


              <div className="action-block__buttons">

                <button
                  type="button"
                  className="btn btn--success"
                  disabled={loading}
                  onClick={() =>
                    handleDecision('approve')
                  }
                >
                  Accept → Stage 2
                </button>


                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={loading}
                  onClick={() =>
                    handleDecision('reject')
                  }
                >
                  Reject
                </button>

              </div>

            </>

          )}


          {/* ====================================================
              USER STAGE 2 FORM
          ==================================================== */}

          {showStage2Form && (

            <div className="stage2-form-container">


              {/* ------------------------------------------------
                  SUCCESS MESSAGE
              ------------------------------------------------ */}

              <div className="status-callout">

                <strong>
                  Stage 1 accepted 🎉
                </strong>

                <p>
                  Manager Stage 1 accepted this wallet.
                </p>

                <p>
                  Enter the Stage 2 details below
                  to send this wallet to Manager Stage 2.
                </p>

              </div>


              {/* ------------------------------------------------
                  COIN NAME
              ------------------------------------------------ */}

              <label className="field">

                <span className="field__label">
                  Coin Name *
                </span>

                <input
                  className="field__input"
                  type="text"
                  value={stage2CoinName}
                  onChange={(e) =>
                    setStage2CoinName(
                      e.target.value
                    )
                  }
                  placeholder="Enter coin name"
                  autoComplete="off"
                />

              </label>


              {/* ------------------------------------------------
                  TRADE DETAILS
              ------------------------------------------------ */}

              <label className="field">

                <span className="field__label">
                  Trade Details / Trade ID *
                </span>

                <input
                  className="field__input field__input--mono"
                  type="text"
                  value={stage2TradeId}
                  onChange={(e) =>
                    setStage2TradeId(
                      e.target.value
                    )
                  }
                  placeholder="Enter trade ID"
                  autoComplete="off"
                />

              </label>


              {/* ------------------------------------------------
                  COST PRICE
              ------------------------------------------------ */}

              <label className="field">

                <span className="field__label">
                  Cost Price *
                </span>

                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) =>
                    setCostPrice(
                      e.target.value
                    )
                  }
                  placeholder="Enter cost price"
                />

              </label>


              {/* ------------------------------------------------
                  SOLD PRICE
              ------------------------------------------------ */}

              <label className="field">

                <span className="field__label">
                  Sold Price *
                </span>

                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={soldPrice}
                  onChange={(e) =>
                    setSoldPrice(
                      e.target.value
                    )
                  }
                  placeholder="Enter sold price"
                />

              </label>


              {/* ------------------------------------------------
                  ERROR
              ------------------------------------------------ */}

              {error && (

                <p className="form-error">
                  {error}
                </p>

              )}


              {/* ------------------------------------------------
                  SUBMIT
              ------------------------------------------------ */}

              <div className="action-block__buttons">

                <button
                  type="button"
                  className="btn btn--success"
                  disabled={loading}
                  onClick={
                    handleStage2Submit
                  }
                >

                  {loading
                    ? 'Submitting...'
                    : 'Submit Stage 2 Details'}

                </button>

              </div>

            </div>

          )}


          {/* ====================================================
              MANAGER STAGE 2
          ==================================================== */}

          {isManager2 &&
            wallet.status === 'Pending Stage 2' &&
            wallet.costPrice != null &&
            wallet.soldPrice != null && (

            <>

              <div className="status-callout">

                <strong>
                  Stage 2 ready for approval
                </strong>

                <p>
                  The user has submitted the
                  Stage 2 details.
                </p>

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
                    Cost Price
                  </dt>

                  <dd>
                    {wallet.costPrice}
                  </dd>

                </div>


                <div className="detail-list__row">

                  <dt>
                    Sold Price
                  </dt>

                  <dd>
                    {wallet.soldPrice}
                  </dd>

                </div>

              </dl>


              <textarea
                className="field__input field__textarea"
                rows="3"
                placeholder="Optional review note"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
              />


              <div className="action-block__buttons">

                <button
                  type="button"
                  className="btn btn--success"
                  disabled={loading}
                  onClick={() =>
                    handleDecision('approve')
                  }
                >
                  Accept → Successful
                </button>


                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={loading}
                  onClick={() =>
                    handleDecision('reject')
                  }
                >
                  Reject → Failed
                </button>

              </div>

            </>

          )}


          {/* ====================================================
              USER STATUS
          ==================================================== */}

          {isUser &&
            !showStage2Form && (

            <div className="status-callout">

              <strong>
                {wallet.status}
              </strong>


              <p>

                {wallet.status ===
                  'Pending Stage 1' && (
                  'Your wallet is waiting for Manager Stage 1 approval.'
                )}


                {wallet.status ===
                  'Pending Stage 2' &&
                  wallet.costPrice != null && (
                  'Stage 2 details submitted. Manager Stage 2 is reviewing the wallet.'
                )}


                {wallet.status ===
                  'Successful' && (
                  'Both manager stages accepted this wallet successfully.'
                )}


                {wallet.status ===
                  'Failed' && (
                  'This wallet was rejected during the approval process.'
                )}

              </p>

            </div>

          )}


          {/* ====================================================
              ADMIN
          ==================================================== */}

          {currentUser.role === 'admin' && (

            <div className="status-callout">

              <strong>
                Admin view
              </strong>

              <p>
                Admin can monitor this wallet and
                its complete approval history.
              </p>

            </div>

          )}


          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (

            <p className="form-error">
              {error}
            </p>

          )}

        </section>

      </div>


      {/* ========================================================
          APPROVAL HISTORY
      ======================================================== */}

      <section className="panel">

        <div className="panel__header">

          <h2 className="panel__title">
            Approval history
          </h2>

        </div>


        <ol className="timeline">

          {[...(wallet.history || [])]
            .reverse()
            .map((history) => (

            <li
              key={history.id}
              className="timeline__item"
            >

              <span className="timeline__dot" />


              <div className="timeline__body">

                <p className="timeline__title">

                  {LABELS[history.type] ||
                    'Update'}

                  <span className="timeline__by">
                    {' '}
                    — {history.by}
                  </span>

                </p>


                <p className="timeline__detail">
                  {history.detail}
                </p>


                <p className="timeline__time">
                  {formatDateTime(history.at)}
                </p>

              </div>

            </li>

          ))}

        </ol>

      </section>

    </div>

  );
}
