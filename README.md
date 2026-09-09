# Vitals React

React/Vite landing page with separate authentication pages prepared for future backend integration.

## Structure

- `src/components/` — reusable landing-page components
- `src/pages/SignIn.jsx` — sign-in page
- `src/pages/CreateAccount.jsx` — create-account page
- `src/pages/ForgotPassword.jsx` — forgot-password page
- `src/pages/Dashboard.jsx` — temporary dashboard route for frontend flow
- `src/styles/main.scss` — global + landing + auth styling
- `src/js/site.js` — shared demo actions/modals

## Routes

- `/` — landing page
- `/signin` — sign in
- `/signup` — create account
- `/forgot-password` — forgot password
- `/dashboard` — temporary post-login screen

## Run

1. Open this project folder in VS Code.
2. Run `npm install`.
3. Run `npm run dev`.

No `react-router-dom` dependency is required. The small route switch in `App.jsx` keeps the project dependency-free and can later be replaced with React Router if the backend/application routing needs it.

## Backend integration points

`SignIn.jsx`: replace the demo timeout with `POST /api/auth/login`.

`CreateAccount.jsx`: replace the demo timeout with `POST /api/auth/register`.

`ForgotPassword.jsx`: replace the demo timeout with `POST /api/auth/forgot-password`.

The visual form fields, validation, loading states, and page separation are already in place so the backend can be connected without redesigning the pages.

## Updated registration and payment flow
- Plan selection is preserved from Pricing → Create Account → Checkout.
- Logged-out users are sent to Create Account, not Sign In.
- Browser/back navigation uses normal history and setup Back returns to the previous page.
- Shared plan prices: India ₹1259/₹1859/₹2659; international $63/$93/$113.
- Backend re-calculates plan price and does not trust the browser amount.
- Email verification fields/routes are included. Configure Google Workspace SMTP in `backend/.env` before sending real verification emails:
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL`.
- After changing dependencies run `cd backend && npm install`.
