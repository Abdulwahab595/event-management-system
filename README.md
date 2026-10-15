# Event Management System

Web Programming - Assignment 2

**Name:** Abdul Wahab  
**Roll Number:** 22i-1714

A React application for exploring events and managing personal event registrations.

## Current progress

The project foundation is ready:

- React setup with a shared navigation bar and simple responsive CSS.
- Routes for Events, Event Details, Login, Register, My Events, and Page Not Found.
- Redux store connected to the app, with an initial guest authentication state.

These pages are placeholders. Event fetching, forms, login persistence, protected routes, event registration, and cancellation are not implemented yet. Redux actions and the remaining shared state will be added with those features.

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
  App.jsx
  main.jsx
  store.js
  styles.css
```

`main.jsx` connects React, Redux, and the router. `App.jsx` defines the routes. Each page has its own component. `store.js` sets up the shared state, and `authSlice.js` will manage the signed-in user.
