# Onchain Intelligence — Wallet Approval Workflow

A full-stack wallet approval workflow using React + Vite on the frontend and Node.js + Express + MongoDB on the backend.

## Roles
- **User** — creates wallet requests and tracks status.
- **Manager Stage 1** — reviews new wallet requests and accepts/rejects them.
- **Manager Stage 2** — enters/reviews cost price and sold price, then accepts/rejects.
- **Admin** — monitors all users and workflow statistics and can create manager/admin accounts.

## Workflow
1. User logs in and clicks **Create wallet**.
2. User enters **Coin name** and **Trade ID**.
3. Wallet starts as **Pending Stage 1**.
4. Manager Stage 1 accepts → wallet becomes **Pending Stage 2** and the user dashboard shows an acceptance popup.
5. Manager Stage 1 rejects → wallet becomes **Failed**.
6. Manager Stage 2 enters **Cost price** and **Sold price** and accepts → wallet becomes **Successful**.
7. Manager Stage 2 rejects → wallet becomes **Failed**.
8. Admin dashboard shows users, login activity, wallet totals, Stage 1 passes, Stage 2 passes, successful wallets, failed wallets, and per-user counts.

## No demo data
The React app contains no mock wallet/user state and the backend seed script no longer inserts demo records.

## Run backend
```bash
cd backend/wallet-research-backend
npm install
cp .env.example .env
# edit MONGODB_URI and JWT_SECRET
npm run create-admin
npm run dev
```

The `create-admin` command reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env`.

## Run frontend
```bash
cd Frontend
npm install
npm run dev
```

Set `VITE_API_URL` if the backend is not running at `http://localhost:5000/api`.

## Default staff accounts

Run `npm run setup-accounts` from `backend/wallet-research-backend` after configuring MongoDB. This creates these accounts only if they do not already exist:

| Role | Email | Password |
|---|---|---|
| Admin | onchain.admin@gmail.com | Admin@12345 |
| Manager Stage 1 | manager.stage1@gmail.com | Manager1@12345 |
| Manager Stage 2 | manager.stage2@gmail.com | Manager2@12345 |

Change these passwords for any non-demo/deployment environment.

## User authentication flow

1. User opens Sign Up and enters **Name, Email, Password, Confirm Password**.
2. Account is created as `user` only; the user is **not automatically logged in**.
3. User is sent to Sign In and logs in with email + password.
4. User can create **any number of wallets**. Each wallet independently starts at Stage 1.
5. Only Stage 1 Manager can move a wallet from `Pending Stage 1` to `Pending Stage 2` or `Failed`.
6. After Stage 1 approval, the User enters Cost Price and Sold Price and submits the Stage 2 details. Only then does the wallet enter the Manager Stage 2 queue. Manager Stage 2 reviews the submitted pricing and moves the wallet to `Successful` or `Failed`.
7. A wallet that has passed Stage 1 is no longer available in the Stage 1 queue; it appears only in the Stage 2 queue.
