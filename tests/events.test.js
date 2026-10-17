import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import eventsReducer, { fetchEvents, fetchEventDetails } from '../src/slices/eventsSlice.js';
import { formatEvent, eventSchedule } from '../src/utils/eventData.js';

test('event data includes the required fields and preserves the venue-local schedule', () => {
  const event = formatEvent({
    id: 'sample', name: 'Sample concert',
    dates: { start: { localDate: '2026-10-16', localTime: '23:30:00', dateTime: '2026-10-17T06:30:00Z' }, timezone: 'America/Los_Angeles', status: { code: 'onsale' } },
    images: [{ url: 'https://example.com/small.jpg', width: 100 }, { url: 'https://example.com/large.jpg', width: 640, ratio: '16_9' }],
    _embedded: { venues: [{ name: 'Sample Hall', city: { name: 'Los Angeles' }, country: { name: 'United States' }, address: { line1: '1 Sample Street' } }] },
    classifications: [{ primary: true, segment: { name: 'Music' }, genre: { name: 'Rock' } }],
    priceRanges: [{ min: 0, max: 20, currency: 'USD' }],
  });
  assert.equal(event.venue, 'Sample Hall');
  assert.equal(event.location, 'Los Angeles, United States');
  assert.equal(event.category, 'Music');
  assert.equal(event.genre, 'Rock');
  assert.equal(event.price, '0–20 USD');
  assert.equal(event.image, 'https://example.com/large.jpg');
  assert.equal(event.statusLabel, 'On sale');
  assert.equal(eventSchedule(event), '2026-10-16 · 23:30 (America/Los_Angeles)');
  assert.equal(event.startDateTime, '2026-10-17T06:30:00Z');
});

test('missing optional information has readable fallbacks', () => {
  const event = formatEvent({ id: 'minimal' });
  assert.equal(event.name, 'Untitled event');
  assert.equal(event.venue, 'Venue not announced');
  assert.equal(event.location, 'Location not announced');
  assert.equal(event.image, '');
  assert.equal(event.category, 'Other');
  assert.equal(event.price, 'Price not listed');
  assert.equal(eventSchedule(event), 'Date to be confirmed');
});

test('uncertain dates and times are not presented as confirmed', () => {
  assert.equal(eventSchedule({ localDate: '2026-12-01', dateTBA: true }), 'Date to be announced');
  assert.equal(eventSchedule({ localDate: '2026-12-01', dateTBD: true }), 'Date to be confirmed');
  assert.match(eventSchedule({ localDate: '2026-12-01', localTime: '00:00:00', timeTBA: true }), /Time to be announced/);
});

test('non-web URLs are excluded from images and official links', () => {
  const event = formatEvent({ id: 'sample', url: 'javascript:alert(1)', images: [{ url: 'data:text/html,test' }] });
  assert.equal(event.url, '');
  assert.equal(event.image, '');
});

test('event list supports errors, retries, and valid empty results', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('list-1'));
  assert.equal(state.status, 'loading');
  state = eventsReducer(state, fetchEvents.rejected(new Error('Network unavailable'), 'list-1'));
  assert.equal(state.status, 'failed');
  assert.equal(state.error, 'Network unavailable');
  state = eventsReducer(state, fetchEvents.pending('list-2'));
  assert.equal(state.error, '');
  state = eventsReducer(state, fetchEvents.fulfilled([], 'list-2'));
  assert.equal(state.status, 'succeeded');
  assert.deepEqual(state.items, []);
});

test('details load independently without replacing the event list', () => {
  let state = eventsReducer(undefined, fetchEvents.fulfilled([{ id: 'listed' }], 'list'));
  state = eventsReducer(state, fetchEventDetails.pending('detail', 'direct-link'));
  state = eventsReducer(state, fetchEventDetails.fulfilled({ id: 'direct-link', name: 'Direct event' }, 'detail', 'direct-link'));
  assert.equal(state.details.item.id, 'direct-link');
  assert.deepEqual(state.items, [{ id: 'listed' }]);
});

test('late detail responses and errors cannot replace a newer route', () => {
  let state = eventsReducer(undefined, fetchEventDetails.pending('old', 'first'));
  state = eventsReducer(state, fetchEventDetails.pending('new', 'second'));
  state = eventsReducer(state, fetchEventDetails.fulfilled({ id: 'first' }, 'old', 'first'));
  state = eventsReducer(state, fetchEventDetails.rejected(new Error('Old error'), 'old', 'first'));
  assert.equal(state.details.eventId, 'second');
  assert.equal(state.details.status, 'loading');
  assert.equal(state.details.item, null);
  state = eventsReducer(state, fetchEventDetails.fulfilled({ id: 'second' }, 'new', 'second'));
  assert.equal(state.details.item.id, 'second');
});

test('duplicate loading requests are skipped without changing active state', async () => {
  const store = configureStore({ reducer: { events: eventsReducer } });
  store.dispatch(fetchEvents.pending('active-list'));
  const listing = await store.dispatch(fetchEvents());
  assert.equal(listing.meta.condition, true);
  assert.equal(store.getState().events.status, 'loading');

  store.dispatch(fetchEventDetails.pending('active-detail', 'same-event'));
  const detail = await store.dispatch(fetchEventDetails('same-event'));
  assert.equal(detail.meta.condition, true);
  assert.equal(store.getState().events.details.requestId, 'active-detail');
});

test('missing API configuration produces a recoverable Redux error', async () => {
  const store = configureStore({ reducer: { events: eventsReducer } });
  await store.dispatch(fetchEvents());
  assert.equal(store.getState().events.status, 'failed');
  assert.match(store.getState().events.error, /not configured/);
});
