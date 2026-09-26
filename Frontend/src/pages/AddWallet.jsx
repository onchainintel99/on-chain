import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useData,
} from "../lib/store";


export default function AddWallet() {
  const {
    createWallet,
    currentUser,
  } = useData();


  const navigate =
    useNavigate();


  /*
   * =========================================================
   * STAGE 1 FORM
   *
   * Stage 1 only asks for:
   * - Trade ID
   *
   * Coin Name, Entry Price, Peak Price and Exit Price
   * will be collected later in Stage 2.
   * =========================================================
   */

  const [
    form,
    setForm,
  ] = useState({
    tradeId: "",
  });


  const [
    error,
    setError,
  ] = useState("");


  const [
    duplicate,
    setDuplicate,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  /*
   * =========================================================
   * FIELD UPDATE
   * =========================================================
   */

  function setField(
    key,
    value
  ) {
    setForm(
      (previous) => ({
        ...previous,

        [key]: value,
      })
    );


    if (key === "tradeId") {
      setDuplicate(false);
      setError("");
    }
  }


  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    setError("");
    setDuplicate(false);


    /*
     * Trade ID validation
     */

    if (
      !form.tradeId.trim()
    ) {
      setError(
        "Trade ID is required."
      );

      return;
    }


    setLoading(true);


    try {
      /*
       * Only send Trade ID to Stage 1.
       */

      const response =
        await createWallet({
          tradeId:
            form.tradeId.trim(),
        });


      /*
       * After successful creation,
       * open the newly created wallet.
       */

      navigate(
        `/wallets/${response.wallet.id}`
      );
    } catch (err) {
      const message =
        err?.message ||
        "Unable to create wallet.";


      /*
       * =====================================================
       * DUPLICATE TRADE ID
       * =====================================================
       */

      const normalizedMessage =
        message.toLowerCase();


      if (
        normalizedMessage.includes(
          "already used"
        ) ||
        normalizedMessage.includes(
          "already exists"
        ) ||
        normalizedMessage.includes(
          "duplicate"
        ) ||
        normalizedMessage.includes(
          "trade id"
        ) &&
        normalizedMessage.includes(
          "unique"
        )
      ) {
        setDuplicate(true);

        setError(
          "This Trade ID is already used. A wallet cannot be created twice with the same Trade ID."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="page">

      <Link
        to="/"
        className="link link--back"
      >
        ← Back to dashboard
      </Link>


      <div className="page__header">

        <div>

          <p className="page__eyebrow">
            ADD WALLET
          </p>

          <h1 className="page__title">
            Create a wallet
          </h1>

          <p className="page__subtitle">
            Created by{" "}
            <strong>
              {currentUser?.name}
            </strong>
            . The wallet will
            start at Stage 1.
          </p>

        </div>

      </div>


      <form
        className="panel form"
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================================
            TRADE ID
        ================================================= */}

        <label className="field">

          <span className="field__label">
            Trade ID *
          </span>

          <input
            className="field__input field__input--mono"
            type="text"
            value={
              form.tradeId
            }
            onChange={(e) =>
              setField(
                "tradeId",
                e.target.value
              )
            }
            placeholder="Enter Trade ID"
            autoFocus
            required
          />

          <span className="field__hint">
            Each Trade ID can only be used once.
          </span>

        </label>


        {/* =================================================
            DUPLICATE / ERROR MESSAGE
        ================================================= */}

        {error && (
          <div
            className={
              duplicate
                ? "duplicate-wallet-alert"
                : "form-error"
            }
            role="alert"
          >

            {duplicate && (
              <span className="duplicate-wallet-alert__icon">
                !
              </span>
            )}

            <div>

              <strong>
                {duplicate
                  ? "Duplicate Trade ID"
                  : "Unable to create wallet"}
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="form__actions">

          <button
            type="submit"
            className="btn btn--primary"
            disabled={
              loading ||
              !form.tradeId.trim()
            }
          >
            {loading
              ? "Creating..."
              : "Create Wallet → Stage 1"}
          </button>

        </div>

      </form>

    </div>
  );
}