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

- Signed-in users can register once per event, receive feedback and cancel their own registrations.
- My Events shows only the current user's records, grouped by upcoming/current, completed, unconfirmed, or cancelled/postponed status.
- Registrations survive refresh and logout. Opening or refreshing event details updates the saved schedule when storage is available.

## Event registration rules

These are local demo registrations, not Ticketmaster bookings or issued tickets. A user can register for an event with a confirmed future start time. Cancelled, postponed, uncertain-start and already-started events cannot accept new registrations. Ticket sale status does not determine availability of this app's local registrations.

The app checks the signed-in user and duplicates in the registration action as well as showing the correct controls. Different users may register for the same event. Cancellation removes only the signed-in user's record and allows registration again while the event remains eligible. Completed records stay in history; upcoming, current, uncertain and cancelled/postponed records can be cancelled.

Registrations are saved separately from accounts and sessions in Local Storage. Each record contains the user ID, registration time and a small event snapshot. Logout preserves these records. A failed save leaves Redux unchanged and shows an error. Invalid saved data is reported instead of silently overwritten. If browser storage is temporarily unavailable, restore access and use the retry control in My Events. Use the same browser and local address for the demo; different origins or cleared browser data have separate or empty records. This is a single-browser frontend simulation, without server-backed accounts or automatic cross-tab synchronisation.

My Events uses saved information so it still works if the API is unavailable. Open the event and choose Refresh details to check for changes. A successful detail load updates saved copies for that event without changing their owners or registration times. There is no background polling for schedule changes.

Completion rules use the [Discovery API's event date fields](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/):

- A valid end timestamp marks the event completed when that time is reached. Approximate end times are labelled as estimates.
- Without an end timestamp, completion is estimated only after the final known event-local calendar date has passed. The final date is the end date if provided, or the start date for a single-day event.
- A multi-day event without a known end stays unconfirmed after its start day. Missing or invalid timezones are not replaced by the viewer's timezone.
- Cancelled/postponed events have their own section; unknown dates stay unconfirmed. A start time alone does not prove completion.

These groupings describe the schedule, not attendance. The display checks the clock every 30 seconds; registration and cancellation also recheck eligibility when clicked.

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

The checks cover account validation, duplicate accounts and event registrations, valid and invalid login, account switching and ownership, Redux state, refresh restoration, logout, malformed saved data, storage failures, event field fallbacks, start/end and timezone boundaries, uncertain schedules, saved schedule updates, combined search parameters, page boundaries, filter resets, duplicate requests and late search/detail responses.

Manual browser check: create a dummy account, open My Events as a guest, log in, refresh, then log out and refresh again. The name should remain after the first refresh and the app should require login after logout. Also try an incorrect password. Check event cards, open a detail page, refresh that direct URL and use Back to events. Search for jazz in New York with Music and United States selected, try Next/Previous, clear the filters and try a no-match keyword. Repeat at a narrow window width. Automated checks do not establish browser navigation or responsive layout.

For registrations: open a future event while logged out, follow Log in to register and check that login returns to that event. Register, open My Events and refresh. Registering again must not add a second record. Log out and create another dummy account; its My Events should be empty. Register it for the same event, cancel it and sign back into the first account. The first user's registration should remain. Check cancellation from both My Events and event details, and try Refresh details.

## Project structure

```text
src/
  components/
    Navbar.jsx
    ProtectedRoute.jsx
    EventCard.jsx
    EventImage.jsx
    EventFilters.jsx
    RegistrationActions.jsx
  hooks/useNow.js
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
    registrationsSlice.js
  utils/
    accounts.js
    eventData.js
    eventSearch.js
    eventTiming.js
    registrations.js
  App.jsx
  main.jsx
  store.js
  styles.css
```

`main.jsx` connects React, Redux, and the router. `App.jsx` defines the routes. Each page has its own component. `store.js` restores the session and sets up shared state. `authSlice.js` manages the signed-in user; storage work stays in `accounts.js`, outside the reducers. `ProtectedRoute.jsx` directs guests to Login.

`registrationsSlice.js` manages saved event registrations. Its action functions check ownership and save to storage before updating Redux. `eventTiming.js` contains the shared date rules used by both details and My Events.
