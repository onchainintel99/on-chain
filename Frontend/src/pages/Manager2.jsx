import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useData } from '../lib/store';
import Badge from '../components/Badge';
import { formatDateTime } from '../lib/utils';

export default function Manager2() {
  const {
    getWallets,
    currentUser,
  } = useData();

  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);


  /*
   * Load wallets waiting for
   * Manager Stage 2 approval.
   *
   * IMPORTANT:
   * These wallets have already:
   *
   * 1. Passed Manager Stage 1
   * 2. Had CP + SP submitted by the user
   * 3. Are now waiting for Manager Stage 2
   */
  async function loadWallets() {
    try {
      setError('');

      const response = await getWallets(
        'status=Pending%20Stage%202'
      );

      /*
       * Extra frontend protection:
       *
       * Only show wallets where CP and SP
       * have actually been submitted.
       */
      const stage2Wallets = (
        response.wallets || []
      ).filter(
        (wallet) =>
          wallet.costPrice != null &&
          wallet.soldPrice != null
      );

      setWallets(stage2Wallets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  /*
   * Initial load
   *
   * Refresh every 5 seconds so that
   * newly submitted Stage 2 wallets
   * appear automatically.
   */
  useEffect(() => {
    loadWallets();

    const interval = setInterval(
      loadWallets,
      5000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);


  return (
    <div className="page">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="page__header">

        <div>

          <h1 className="page__title">
            Manager Stage 2
          </h1>

          <p className="page__subtitle">
            Review cost price and sold price submitted
            by users after Stage 1 approval.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* STATISTICS */}
      {/* ================================================== */}

      <section className="stat-grid">

        <div className="stat-card">

          <div className="stat-card__label">
            Pending Stage 2
          </div>

          <div className="stat-card__value">
            {wallets.length}
          </div>

        </div>

      </section>


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}


      {/* ================================================== */}
      {/* STAGE 2 QUEUE */}
      {/* ================================================== */}

      <section className="panel">

        <div className="panel__header">

          <div>

            <h2 className="panel__title">
              Stage 2 approval queue
            </h2>

            <p className="page__hint">
              Review the Cost Price and Sold Price.
              Accepting the wallet makes it Successful.
            </p>

          </div>

          <span className="panel__count">
            {wallets.length} pending
          </span>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading Stage 2 requests...
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
                    User
                  </th>

                  <th>
                    Cost Price
                  </th>

                  <th>
                    Sold Price
                  </th>

                  <th>
                    Submitted
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {wallets.map(
                  (wallet) => (

                    <tr key={wallet.id}>

                      {/* Coin */}

                      <td>
                        <strong>
                          {wallet.coinName}
                        </strong>
                      </td>


                      {/* Trade ID */}

                      <td className="mono-cell">
                        {wallet.tradeId}
                      </td>


                      {/* User */}

                      <td>

                        <strong>
                          {wallet.userName}
                        </strong>

                        <div className="table-sub">
                          {wallet.userEmail}
                        </div>

                      </td>


                      {/* Cost Price */}

                      <td>
                        <strong>
                          {wallet.costPrice}
                        </strong>
                      </td>


                      {/* Sold Price */}

                      <td>
                        <strong>
                          {wallet.soldPrice}
                        </strong>
                      </td>


                      {/* Submitted */}

                      <td>
                        {formatDateTime(
                          wallet.lastUpdated
                        )}
                      </td>


                      {/* Status */}

                      <td>

                        <Badge
                          status={wallet.status}
                        />

                      </td>


                      {/* Review */}

                      <td>

                        <Link
                          to={`/wallets/${wallet.id}`}
                          className="btn btn--small btn--primary"
                        >
                          Review
                        </Link>

                      </td>

                    </tr>

                  )
                )}


                {/* EMPTY STATE */}

                {!wallets.length && (

                  <tr>

                    <td
                      colSpan="8"
                      className="empty-row"
                    >
                      No wallets are waiting for
                      Stage 2 approval.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ================================================== */}
      {/* CURRENT MANAGER */}
      {/* ================================================== */}

      <p className="page__hint">

        Signed in as{' '}

        <strong>
          {currentUser?.name}
        </strong>

        {' · '}

        {currentUser?.email}

      </p>

    </div>
  );
}