# Event Management System

Web Programming - Assignment 2

**Name:** Abdul Wahab  
**Roll Number:** 22i-1714

A React application for exploring events and managing personal event registrations.

## Current progress

The initial React project is set up. Event browsing, authentication, and registrations will be added in later steps.

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
