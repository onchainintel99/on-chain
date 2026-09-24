import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useData } from '../lib/store';

import Badge from '../components/Badge';

import { formatDateTime } from '../lib/utils';

import Admin from './Admin';


function MetricCard({
  label,
  value,
  type = '',
}) {
  return (
    <div
      className={`dashboard-metric ${
        type
          ? `dashboard-metric--${type}`
          : ''
      }`}
    >

      <div className="dashboard-metric__label">
        {label}
      </div>

      <div className="dashboard-metric__value">
        {value}
      </div>

    </div>
  );
}


/* ========================================================= */
/* USER DASHBOARD                                             */
/* ========================================================= */

function UserDashboard() {
  const {
    getOverview,
    getWallets,
    currentUser,
  } = useData();

  const navigate = useNavigate();


  const [overview, setOverview] =
    useState(null);

  const [wallets, setWallets] =
    useState([]);

  const [popup, setPopup] =
    useState(null);


  const [
    previousStatuses,
    setPreviousStatuses,
  ] = useState({});


  async function loadDashboard() {
    try {

      const [
        overviewResponse,
        walletsResponse,
      ] = await Promise.all([
        getOverview(),
        getWallets('mine=true'),
      ]);


      setOverview(
        overviewResponse.overview
      );


      const walletList =
        walletsResponse.wallets || [];

      setWallets(walletList);


      const nextStatuses = {
        ...previousStatuses,
      };


      walletList.forEach((wallet) => {

        const oldStatus =
          nextStatuses[wallet.id];


        /*
         * Stage 1 accepted
         */
        if (
          oldStatus ===
            'Pending Stage 1' &&
          wallet.status ===
            'Pending Stage 2'
        ) {
          setPopup(wallet);
        }


        nextStatuses[wallet.id] =
          wallet.status;

      });


      setPreviousStatuses(
        nextStatuses
      );

    } catch (error) {
      console.error(
        'Dashboard error:',
        error
      );
    }
  }


  useEffect(() => {

    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        5000
      );

    return () =>
      clearInterval(interval);

  }, []);


  useEffect(() => {

    if (!popup) {
      return;
    }


    const timeout =
      setTimeout(() => {

        navigate(
          `/wallets/${popup.id}`
        );

      }, 1500);


    return () =>
      clearTimeout(timeout);

  }, [popup, navigate]);


  if (!overview) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }


  const recentWallets =
    wallets.slice(0, 6);


  return (
    <div className="dashboard-page">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="dashboard-hero">

        <div>

          <p className="dashboard-eyebrow">
            USER DASHBOARD
          </p>

          <h1 className="dashboard-title">
            Welcome back,{' '}
            {currentUser.name
              .split(' ')[0]}
          </h1>

          <p className="dashboard-subtitle">
            Track your wallets and approval
            progress from one place.
          </p>

        </div>


        <Link
          to="/create-wallet"
          className="dashboard-create-btn"
        >
          <span>+</span>
          Create Wallet
        </Link>

      </div>


      {/* ============================================== */}
      {/* STAGE 1 POPUP */}
      {/* ============================================== */}

      {popup && (

        <div className="approval-notification">

          <div className="approval-notification__icon">
            ✓
          </div>

          <div className="approval-notification__content">

            <strong>
              Stage 1 accepted 🎉
            </strong>

            <p>
              {popup.coinName}
              {' · '}
              {popup.tradeId}
              {' '}
              has been accepted by
              Manager Stage 1.
            </p>

            <span>
              Enter Cost Price and Sold Price
              to continue to Stage 2.
            </span>

          </div>


          <div className="approval-notification__actions">

            <Link
              to={`/wallets/${popup.id}`}
              className="btn btn--success"
              onClick={() =>
                setPopup(null)
              }
            >
              Enter CP & SP
            </Link>

            <button
              className="btn btn--ghost"
              onClick={() =>
                setPopup(null)
              }
            >
              Later
            </button>

          </div>

        </div>

      )}


      {/* ============================================== */}
      {/* METRICS */}
      {/* ============================================== */}

      <section className="dashboard-metrics">

        <MetricCard
          label="Total Wallets"
          value={overview.total}
          type="violet"
        />

        <MetricCard
          label="Stage 1 In Review"
          value={overview.stage1}
          type="gold"
        />

        <MetricCard
          label="Stage 2 In Review"
          value={overview.stage2}
          type="gold"
        />

        <MetricCard
          label="Successful"
          value={overview.successful}
          type="teal"
        />

        <MetricCard
          label="Failed"
          value={overview.failed}
          type="red"
        />

      </section>


      {/* ============================================== */}
      {/* RECENT ACTIVITY */}
      {/* ============================================== */}

      <section className="dashboard-card">

        <div className="dashboard-card__header">

          <div>

            <h2>
              Recent Wallet Activity
            </h2>

            <p>
              Your latest wallet requests
              and approval updates.
            </p>

          </div>


          <Link
            to="/wallets"
            className="dashboard-link"
          >
            View all wallets →
          </Link>

        </div>


        <div className="activity-list">

          {recentWallets.map(
            (wallet) => (

              <Link
                key={wallet.id}
                to={`/wallets/${wallet.id}`}
                className="activity-item"
              >

                <div className="activity-item__icon">
                  {wallet.coinName
                    ?.charAt(0)
                    ?.toUpperCase() || 'W'}
                </div>


                <div className="activity-item__main">

                  <div className="activity-item__title">

                    <strong>
                      {wallet.coinName}
                    </strong>

                    <span className="activity-trade">
                      {wallet.tradeId}
                    </span>

                  </div>


                  <span className="activity-item__time">
                    {formatDateTime(
                      wallet.lastUpdated
                    )}
                  </span>

                </div>


                <div className="activity-item__stage">

                  <span>
                    Stage {wallet.stage}
                  </span>

                  <Badge
                    status={
                      wallet.status
                    }
                  />

                </div>


                <span className="activity-arrow">
                  →
                </span>

              </Link>

            )
          )}


          {!recentWallets.length && (

            <div className="activity-empty">

              <div className="activity-empty__icon">
                ◈
              </div>

              <h3>
                No wallets yet
              </h3>

              <p>
                Create your first wallet
                to start the approval process.
              </p>

              <Link
                to="/create-wallet"
                className="btn btn--primary"
              >
                Create Wallet
              </Link>

            </div>

          )}

        </div>

      </section>


      {/* ============================================== */}
      {/* WORKFLOW */}
      {/* ============================================== */}

      <section className="dashboard-card">

        <div className="dashboard-card__header">

          <div>

            <h2>
              Approval Workflow
            </h2>

            <p>
              Every wallet follows the same
              two-stage approval process.
            </p>

          </div>

        </div>


        <div className="workflow">

          <div className="workflow-step is-active">

            <div className="workflow-step__number">
              1
            </div>

            <div>

              <strong>
                Manager Stage 1
              </strong>

              <span>
                Wallet verification
              </span>

            </div>

          </div>


          <div className="workflow-line" />


          <div className="workflow-step">

            <div className="workflow-step__number">
              2
            </div>

            <div>

              <strong>
                Stage 2 Details
              </strong>

              <span>
                Enter Cost Price + Sold Price
              </span>

            </div>

          </div>


          <div className="workflow-line" />


          <div className="workflow-step">

            <div className="workflow-step__number">
              3
            </div>

            <div>

              <strong>
                Manager Stage 2
              </strong>

              <span>
                Final approval
              </span>

            </div>

          </div>


          <div className="workflow-line" />


          <div className="workflow-step">

            <div className="workflow-step__number workflow-step__number--success">
              ✓
            </div>

            <div>

              <strong>
                Successful
              </strong>

              <span>
                Wallet approved
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}


/* ========================================================= */
/* MANAGER DASHBOARD                                          */
/* ========================================================= */

function ManagerDashboard({ stage }) {

  const {
    getWallets,
    currentUser,
  } = useData();


  const [wallets, setWallets] =
    useState([]);


  const status =
    stage === 1
      ? 'Pending Stage 1'
      : 'Pending Stage 2';


  async function load() {

    try {

      const response =
        await getWallets(
          `status=${encodeURIComponent(
            status
          )}`
        );


      let list =
        response.wallets || [];


      /*
       * Stage 2 should only show wallets
       * where CP and SP have been submitted.
       */
      if (stage === 2) {

        list = list.filter(
          (wallet) =>
            wallet.costPrice != null &&
            wallet.soldPrice != null
        );

      }


      setWallets(list);

    } catch (error) {

      console.error(
        'Manager dashboard error:',
        error
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
      clearInterval(interval);

  }, [stage]);


  return (
    <div className="dashboard-page">

      <div className="dashboard-hero">

        <div>

          <p className="dashboard-eyebrow">
            APPROVAL DESK
          </p>

          <h1 className="dashboard-title">
            Manager Stage {stage}
          </h1>

          <p className="dashboard-subtitle">

            {stage === 1
              ? 'Review new wallet requests submitted by users.'
              : 'Review Cost Price and Sold Price before final approval.'}

          </p>

        </div>

      </div>


      <section className="dashboard-metrics">

        <MetricCard
          label={`Pending Stage ${stage}`}
          value={wallets.length}
          type="gold"
        />

        <MetricCard
          label="Approval Stage"
          value={stage}
          type="violet"
        />

        <MetricCard
          label="Role"
          value="Manager"
          type="teal"
        />

      </section>


      <section className="dashboard-card">

        <div className="dashboard-card__header">

          <div>

            <h2>
              {stage === 1
                ? 'Stage 1 Approval Queue'
                : 'Stage 2 Approval Queue'}
            </h2>

            <p>

              {stage === 1
                ? 'Verify each wallet before moving it to Stage 2.'
                : 'Review submitted pricing before marking the wallet successful.'}

            </p>

          </div>


          <span className="queue-count">
            {wallets.length} pending
          </span>

        </div>


        <div className="activity-list">

          {wallets.map(
            (wallet) => (

              <Link
                key={wallet.id}
                to={`/wallets/${wallet.id}`}
                className="activity-item"
              >

                <div className="activity-item__icon">
                  {wallet.coinName
                    ?.charAt(0)
                    ?.toUpperCase() || 'W'}
                </div>


                <div className="activity-item__main">

                  <div className="activity-item__title">

                    <strong>
                      {wallet.coinName}
                    </strong>

                    <span className="activity-trade">
                      {wallet.tradeId}
                    </span>

                  </div>


                  <span className="activity-item__time">
                    {wallet.userName}
                    {' · '}
                    {formatDateTime(
                      wallet.dateAdded
                    )}
                  </span>

                </div>


                <div className="activity-item__stage">

                  {stage === 2 && (
                    <span>
                      CP: {wallet.costPrice}
                      {' · '}
                      SP: {wallet.soldPrice}
                    </span>
                  )}

                  <Badge
                    status={
                      wallet.status
                    }
                  />

                </div>


                <span className="activity-arrow">
                  Review →
                </span>

              </Link>

            )
          )}


          {!wallets.length && (

            <div className="activity-empty">

              <div className="activity-empty__icon">
                ✓
              </div>

              <h3>
                Queue is clear
              </h3>

              <p>
                No wallets are waiting
                for Stage {stage} approval.
              </p>

            </div>

          )}

        </div>

      </section>


      <p className="dashboard-footer-info">
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


/* ========================================================= */
/* MAIN DASHBOARD                                             */
/* ========================================================= */

export default function Dashboard() {

  const {
    currentUser,
  } = useData();


  if (
    currentUser.role ===
    'manager1'
  ) {
    return (
      <ManagerDashboard
        stage={1}
      />
    );
  }


  if (
    currentUser.role ===
    'manager2'
  ) {
    return (
      <ManagerDashboard
        stage={2}
      />
    );
  }


  if (
    currentUser.role ===
    'admin'
  ) {
    return <Admin />;
  }


  return <UserDashboard />;
}