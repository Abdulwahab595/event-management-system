# Event Management System

Web Programming - Assignment 2

**Name:** Abdul Wahab  
**Roll Number:** 22i-1714

A React application for exploring events and managing personal event registrations.

## Current progress

Completed so far:

- React setup with a shared navigation bar and simple responsive CSS.
- Routes for Events, Event Details, Login, Register, My Events, and Page Not Found.
- Redux authentication state, with login/logout actions and the signed-in user's name in the navigation bar.
- Account registration with name, email, and password validation, duplicate-email checks, and saved local accounts.
- Login with saved accounts, session persistence after refresh, and logout that removes the saved session.
- My Events requires login and returns the user there after signing in.

Real event fetching, event registration, cancellation, and personal event lists are not implemented yet. The event pages remain placeholders.

## Demo account registration

Open Register and enter a name, a valid email address, and a sample password with at least six characters. Names are trimmed, and email addresses are trimmed and converted to lowercase. Duplicate email addresses are rejected.

Accounts are saved only in this browser's Local Storage. The saved record contains a SHA-256 password hash rather than the entered password. This is a frontend class-project simulation, not production authentication; use dummy credentials. Creating an account does not sign the user in; use Login afterward.

Login checks the saved email and password, remembers the account ID in Local Storage, and updates Redux with the user's ID, name, and email. On refresh, the store restores that profile from the saved accounts. Logout removes the remembered ID and clears the Redux user. Passwords and hashes are never placed in Redux. Missing or unreadable saved session data starts the app as a guest. Storage failures during login or logout show an error instead of claiming success.

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

The checks cover account validation, duplicate registrations, valid and invalid login, account switching, Redux state, refresh restoration, logout, malformed saved data, and storage failures.

Manual browser check: create a dummy account, open My Events as a guest, log in, refresh, then log out and refresh again. The name should remain after the first refresh and the app should require login after logout. Also try an incorrect password. Browser interaction and visual checks are still pending.

## Project structure

```text
src/
  components/
    Navbar.jsx
    ProtectedRoute.jsx
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

`main.jsx` connects React, Redux, and the router. `App.jsx` defines the routes. Each page has its own component. `store.js` restores the session and sets up shared state. `authSlice.js` manages the signed-in user; storage work stays in `accounts.js`, outside the reducers. `ProtectedRoute.jsx` directs guests to Login.
