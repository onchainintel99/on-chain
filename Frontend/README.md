# Onchain Intelligence Frontend

React + Vite frontend for the wallet approval workflow.

No demo users or demo wallets are stored in the frontend. Authentication uses email + password and all wallet state comes from the backend API. Signup creates a User account and then sends the user to Sign In.

Run:
```bash
npm install
npm run dev
```

Optional environment variable:
```bash
VITE_API_URL=http://localhost:5000/api
```
