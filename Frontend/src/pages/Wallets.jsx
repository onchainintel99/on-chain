import React, {
  useEffect,
  useState
} from 'react';

import { Link } from 'react-router-dom';

import { useData } from '../lib/store';

import Badge from '../components/Badge';

import { formatDateTime } from '../lib/utils';


export default function Wallets() {

  const {
    getWallets,
    currentUser
  } = useData();


  const [wallets, setWallets] = useState([]);

  const [search, setSearch] = useState('');


  /*
   * Load wallets
   */
  useEffect(() => {

    async function loadWallets() {

      try {

        const response =
          await getWallets(
            currentUser.role === 'user'
              ? 'mine=true'
              : ''
          );

        setWallets(
          response.wallets || []
        );

      } catch (error) {

        console.error(
          'Wallet loading error:',
          error
        );

      }

    }


    loadWallets();


    /*
     * Refresh every 5 seconds
     *
     * This is useful because Manager Stage 1
     * may approve a wallet while the user
     * is still on this page.
     */
    const interval =
      setInterval(
        loadWallets,
        5000
      );


    return () =>
      clearInterval(interval);

  }, [currentUser]);


  /*
   * Search
   */
  const filteredWallets =
    wallets.filter((wallet) => {

      const text = `
        ${wallet.coinName}
        ${wallet.tradeId}
        ${wallet.userName}
      `.toLowerCase();


      return text.includes(
        search.toLowerCase()
      );

    });


  /*
   * Check whether user needs to
   * enter CP + SP.
   */
  function needsStage2Details(wallet) {

    return (
      currentUser.role === 'user' &&
      wallet.status === 'Pending Stage 2' &&
      wallet.costPrice == null
    );

  }


  return (

    <div className="page">


      {/* HEADER */}

      <div className="page__header">

        <div>

          <h1 className="page__title">

            {currentUser.role === 'user'
              ? 'My wallets'
              : 'Wallet pipeline'}

          </h1>


          <p className="page__subtitle">

            {currentUser.role === 'user'
              ? 'Track all your wallet requests and approval status.'
              : 'All wallet requests currently visible to your role.'}

          </p>

        </div>


        {/* User can create unlimited wallets */}

        {currentUser.role === 'user' && (

          <Link
            to="/create-wallet"
            className="btn btn--primary"
          >
            + Create wallet
          </Link>

        )}

      </div>


      {/* SEARCH */}

      <div className="toolbar">

        <input
          className="search-input"
          placeholder="Search coin, trade ID or user..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>


      {/* TABLE */}

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


            {filteredWallets.map(
              (wallet) => {

                const stage2Details =
                  needsStage2Details(
                    wallet
                  );


                return (

                  <tr key={wallet.id}>


                    {/* Coin */}

                    <td>
                      {wallet.coinName}
                    </td>


                    {/* Trade ID */}

                    <td className="mono-cell">
                      {wallet.tradeId}
                    </td>


                    {/* User */}

                    <td>
                      {wallet.userName}
                    </td>


                    {/* Stage */}

                    <td>
                      Stage {wallet.stage}
                    </td>


                    {/* Status */}

                    <td>

                      <Badge
                        status={wallet.status}
                      />

                    </td>


                    {/* Updated */}

                    <td>
                      {formatDateTime(
                        wallet.lastUpdated
                      )}
                    </td>


                    {/* ACTION */}

                    <td>

                      <Link
                        to={`/wallets/${wallet.id}`}
                        className={
                          stage2Details
                            ? 'btn btn--small btn--primary'
                            : 'btn btn--small'
                        }
                      >

                        {stage2Details
                          ? 'Enter CP & SP'
                          : 'View'}

                      </Link>

                    </td>

                  </tr>

                );

              }
            )}


            {/* EMPTY */}

            {!filteredWallets.length && (

              <tr>

                <td
                  colSpan="7"
                  className="empty-row"
                >

                  No wallet records found.

                </td>

              </tr>

            )}


          </tbody>

        </table>

      </div>

    </div>

  );
}