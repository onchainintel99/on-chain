import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useData } from '../lib/store';
import Badge from '../components/Badge';
import { formatDateTime } from '../lib/utils';

export default function Manager1() {
  const {
    getWallets,
    currentUser,
  } = useData();

  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);


  /*
   * Load wallets waiting for
   * Manager Stage 1 approval.
   */
  async function loadWallets() {
    try {
      setError('');

      const response = await getWallets(
        'status=Pending%20Stage%201'
      );

      setWallets(
        response.wallets || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  /*
   * Load initially and refresh
   * every 5 seconds.
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
            Manager Stage 1
          </h1>

          <p className="page__subtitle">
            Review wallet requests submitted by users.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* MANAGER INFO */}
      {/* ================================================== */}

      <section className="stat-grid">

        <div className="stat-card">

          <div className="stat-card__label">
            Pending Stage 1
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
      {/* WALLET QUEUE */}
      {/* ================================================== */}

      <section className="panel">

        <div className="panel__header">

          <div>

            <h2 className="panel__title">
              Stage 1 approval queue
            </h2>

            <p className="page__hint">
              Accept a wallet to move it to Stage 2.
              Reject a wallet to mark it as Failed.
            </p>

          </div>

          <span className="panel__count">
            {wallets.length} pending
          </span>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading wallet requests...
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


                      {/* Date */}

                      <td>
                        {formatDateTime(
                          wallet.dateAdded
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


                {/* No wallets */}

                {!wallets.length && (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty-row"
                    >
                      No wallets are waiting
                      for Stage 1 approval.
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