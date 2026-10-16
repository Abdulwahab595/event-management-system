# Event Management System

Web Programming - Assignment 2

**Name:** Abdul Wahab  
**Roll Number:** 22i-1714

A React application for exploring events and managing personal event registrations.

## Current progress

Completed so far:

- React setup with a shared navigation bar and simple responsive CSS.
- Routes for Events, Event Details, Login, Register, My Events, and Page Not Found.
- Redux store connected to the app, with an initial guest authentication state.
- Account registration with name, email, and password validation, duplicate-email checks, and saved local accounts.

Login, logout, session persistence, real event fetching, protected routes, event registration, and cancellation are not implemented yet. The corresponding pages remain placeholders. Redux actions and the remaining shared state will be added with those features.

## Demo account registration

Open Register and enter a name, a valid email address, and a sample password with at least six characters. Names are trimmed, and email addresses are trimmed and converted to lowercase. Duplicate email addresses are rejected.

Accounts are saved only in this browser's Local Storage. The saved record contains a SHA-256 password hash rather than the entered password. This is a frontend class-project simulation, not production authentication; use dummy credentials. Creating an account does not sign the user in. Login will be added next.

## Technologies

- React
- Redux Toolkit and React Redux
- React Router
- Vite
- Plain CSS
- Ticketmaster Discovery API (integration pending)

## Run locally

Use Node.js 24 (tested with 24.21.0) and npm.

1. Clone the repository and open its folder.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the application:

   ```bash
   npm run dev
   ```

4. Open the local address printed in the terminal.

## API key

The current foundation runs without an API key. When the event integration is added, create an account at the [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) and obtain a Discovery API key.

Copy `.env.example` to `.env` and place your key after `VITE_TICKETMASTER_API_KEY=`. Do not commit `.env` or put a real key in this README. Environment variables keep the key out of the repository; a browser-used key is still visible in browser requests.

## Production build

```bash
npm run build
npm run preview
```

The build is created in the ignored `dist` folder.

## Checks

```bash
npm test
```

The account checks cover validation, normalized and overlapping duplicate registrations, separate accounts, malformed saved data, and storage failures.

## Project structure

```text
src/
  components/Navbar.jsx
  pages/
    Events.jsx
    EventDetails.jsx
    Login.jsx
    Register.jsx
    MyEvents.jsx
    NotFound.jsx
  slices/authSlice.js
  utils/accounts.js
  App.jsx
  main.jsx
  store.js
  styles.css
```

`main.jsx` connects React, Redux, and the router. `App.jsx` defines the routes. Each page has its own component. `store.js` sets up the shared state, and `authSlice.js` will manage the signed-in user. `accounts.js` validates and saves demo accounts.
