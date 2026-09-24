# Wallet Approval Backend

Node.js + Express + MongoDB API for the Onchain Intelligence wallet approval workflow.

Roles: `user`, `manager1`, `manager2`, `admin`.

The backend intentionally contains no demo/seed records. `npm run seed` is retained only as a safe no-op message for older workflows. Use `npm run create-admin` after configuring `.env` to create the first admin.


### Default manager/admin accounts
Use `npm run setup-accounts` to create the fixed development accounts:
- Admin: `onchain.admin@gmail.com` / `Admin@12345`
- Manager Stage 1: `manager.stage1@gmail.com` / `Manager1@12345`
- Manager Stage 2: `manager.stage2@gmail.com` / `Manager2@12345`

The setup script never inserts wallet demo records.
