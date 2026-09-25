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


  const [
    form,
    setForm,
  ] = useState({
    coinName: "",
    tradeId: "",
    notes: "",
  });


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


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
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");


    if (
      !form.coinName.trim()
    ) {
      setError(
        "Coin name is required."
      );

      return;
    }


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
      const response =
        await createWallet(
          form
        );


      navigate(
        `/wallets/${response.wallet.id}`
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  }


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

        <label className="field">

          <span className="field__label">
            Coin Name *
          </span>

          <input
            className="field__input"
            type="text"
            value={
              form.coinName
            }
            onChange={(e) =>
              setField(
                "coinName",
                e.target.value
              )
            }
            placeholder="e.g. Bitcoin"
            autoFocus
          />

        </label>


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
          />

        </label>


        <label className="field">

          <span className="field__label">
            Notes
          </span>

          <textarea
            className="field__input field__textarea"
            rows="5"
            value={
              form.notes
            }
            onChange={(e) =>
              setField(
                "notes",
                e.target.value
              )
            }
            placeholder="Optional wallet notes"
          />

        </label>


        {error && (
          <p className="form-error">
            {error}
          </p>
        )}


        <div className="form__actions">

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
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