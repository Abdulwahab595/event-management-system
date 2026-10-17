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
- Ticketmaster browsing shows scheduled upcoming events, sorted by date, with category labels and reusable cards.
- Search by keyword and combine city, category and country filters. Search applies the form together; Clear filters restores all upcoming events.
- Previous/Next navigation shows 20 events per page and retains the applied filters when opening details and returning.
- Individual details load by event ID, including on a direct URL, with date/time, venue, location, category, image and available description, status, prices and official link.
- Redux keeps listing and detail request states separate. Pages show loading, retry, empty and missing-information messages.

Event registration, cancellation, and personal event lists are not implemented yet. My Events remains a placeholder after login.

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
- Ticketmaster Discovery API

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

Create an account at the [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) and obtain a Discovery API key (Consumer Key). Event browsing requires this key; local demo accounts can work without it.

Copy `.env.example` to `.env` and place your key after `VITE_TICKETMASTER_API_KEY=`. Do not commit `.env` or put a real key in this README. Environment variables keep the key out of the repository; a browser-used key is still visible in browser requests.

Restart the development server after changing `.env`. The app uses `/discovery/v2/events.json` for upcoming events and `/discovery/v2/events/{id}.json` for details. Requests start at least 600 ms apart within this app instance, following the assignment's two-per-second limit. The account quota is shared across browser tabs and other uses of the key. Failed requests can be retried; a 15-second timeout avoids an endless loading state. If authorization fails, check the Consumer Key and its approval in the developer portal.

Dates and times are shown in the event's local timezone without converting them to the viewer's timezone. Unknown dates/times are labelled as unconfirmed. The upcoming query uses the current UTC time. Descriptions are displayed as plain text. Loading a different detail page ignores late responses from the previous event.

Search uses the API's `keyword`, `city`, `segmentName`, and `countryCode` parameters together. Blank fields are omitted. The country dropdown offers common markets; All countries leaves the location unrestricted. Typing does not make requests until Search is pressed. Applied filters and pagination are kept in Redux during navigation; a browser refresh starts a fresh search.

New searches and Refresh events start on page 1 with a fresh upcoming-time boundary. Paging keeps that boundary fixed. Older search responses are ignored after filters change. The [Discovery API paging limit](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) restricts this app to the first 1,000 matches (50 pages); narrow the filters for more specific results.

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

The checks cover account validation, duplicate registrations, valid and invalid login, account switching, Redux state, refresh restoration, logout, malformed saved data, storage failures, event field fallbacks, uncertain schedules, combined search parameters, page boundaries, filter resets, duplicate requests and late search/detail responses.

Manual browser check: create a dummy account, open My Events as a guest, log in, refresh, then log out and refresh again. The name should remain after the first refresh and the app should require login after logout. Also try an incorrect password. Check event cards, open a detail page, refresh that direct URL and use Back to events. Search for jazz in New York with Music and United States selected, try Next/Previous, clear the filters and try a no-match keyword. Repeat at a narrow window width. Automated checks do not establish browser navigation or responsive layout.

## Project structure

```text
src/
  components/
    Navbar.jsx
    ProtectedRoute.jsx
    EventCard.jsx
    EventImage.jsx
    EventFilters.jsx
  pages/
    Events.jsx
    EventDetails.jsx
    Login.jsx
    Register.jsx
    MyEvents.jsx
    NotFound.jsx
  services/ticketmaster.js
  slices/
    authSlice.js
    eventsSlice.js
  utils/
    accounts.js
    eventData.js
    eventSearch.js
  App.jsx
  main.jsx
  store.js
  styles.css
```

`main.jsx` connects React, Redux, and the router. `App.jsx` defines the routes. Each page has its own component. `store.js` restores the session and sets up shared state. `authSlice.js` manages the signed-in user; storage work stays in `accounts.js`, outside the reducers. `ProtectedRoute.jsx` directs guests to Login.
