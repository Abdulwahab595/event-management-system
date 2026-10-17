import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import eventsReducer, { applyFilters, changePage, fetchEvents, fetchEventDetails, refreshResults } from '../src/slices/eventsSlice.js';
import { formatEvent, eventSchedule } from '../src/utils/eventData.js';
import { buildEventQuery, emptyFilters } from '../src/utils/eventSearch.js';

const startDateTime = '2026-10-17T03:00:00Z';
function results(items = [], totalElements = items.length) {
  return { items, totalElements, totalPages: Math.min(50, Math.ceil(totalElements / 20)), startDateTime };
}

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
  state = eventsReducer(state, fetchEvents.fulfilled(results(), 'list-2'));
  assert.equal(state.status, 'succeeded');
  assert.deepEqual(state.items, []);
});

test('details load independently without replacing the event list', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('list'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'listed' }]), 'list'));
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

test('all search criteria are combined and safely encoded without changing their meaning', () => {
  const query = buildEventQuery({
    filters: { keyword: '  Rock & Roll  ', city: ' New York ', category: 'Arts & Theatre', countryCode: ' us ' },
    page: 2, startDateTime,
  });
  const encoded = new URLSearchParams(query);
  assert.equal(encoded.get('keyword'), 'Rock & Roll');
  assert.equal(encoded.get('city'), 'New York');
  assert.equal(encoded.get('segmentName'), 'Arts & Theatre');
  assert.equal(encoded.get('countryCode'), 'US');
  assert.equal(encoded.get('page'), '2');
  assert.equal(encoded.get('startDateTime'), startDateTime);
  assert.equal(encoded.get('sort'), 'date,asc');
});

test('empty filters are omitted and out-of-range pages are rejected', () => {
  const query = buildEventQuery({ filters: { keyword: '  ', city: '' }, startDateTime });
  assert.equal('keyword' in query, false);
  assert.equal('city' in query, false);
  assert.equal('segmentName' in query, false);
  assert.equal('countryCode' in query, false);
  assert.equal(query.page, '0');
  assert.equal(buildEventQuery({ page: 49, startDateTime }).size, '20');
  for (const page of [-1, 50, 1.5]) assert.throws(() => buildEventQuery({ page }), /unavailable/);
});

test('new filters reset pagination and invalidate a previous search response', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('first'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'old' }], 100), 'first'));
  state = eventsReducer(state, changePage(3));
  state = eventsReducer(state, fetchEvents.pending('previous-page'));
  state = eventsReducer(state, applyFilters({ keyword: ' jazz ', countryCode: 'us' }));
  assert.equal(state.page, 0);
  assert.equal(state.filters.keyword, 'jazz');
  assert.equal(state.filters.countryCode, 'US');
  assert.equal(state.startDateTime, '');
  assert.deepEqual(state.items, []);
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'stale' }]), 'previous-page'));
  state = eventsReducer(state, fetchEvents.rejected(new Error('Stale error'), 'previous-page'));
  assert.equal(state.status, 'idle');
  assert.equal(state.error, '');
  assert.deepEqual(state.items, []);
});

test('page changes retain applied filters and the upcoming-time boundary', () => {
  let state = eventsReducer(undefined, applyFilters({ category: 'Music', countryCode: 'GB' }));
  state = eventsReducer(state, fetchEvents.pending('page-0'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'first' }], 45), 'page-0'));
  assert.equal(eventsReducer(state, changePage(-1)), state);
  assert.equal(eventsReducer(state, changePage(3)), state);
  state = eventsReducer(state, changePage(1));
  assert.equal(state.page, 1);
  assert.equal(state.status, 'idle');
  assert.equal(state.filters.category, 'Music');
  assert.equal(state.filters.countryCode, 'GB');
  assert.equal(state.startDateTime, startDateTime);
  state = eventsReducer(state, fetchEvents.pending('page-1'));
  assert.equal(eventsReducer(state, changePage(2)), state);
});

test('refresh retains filters and clearing them restores the default search', () => {
  let state = eventsReducer(undefined, applyFilters({ city: 'London', category: 'Music' }));
  state = eventsReducer(state, fetchEvents.pending('current'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'one' }], 60), 'current'));
  state = eventsReducer(state, changePage(2));
  state = eventsReducer(state, refreshResults());
  assert.equal(state.page, 0);
  assert.equal(state.startDateTime, '');
  assert.equal(state.filters.city, 'London');
  state = eventsReducer(state, applyFilters(emptyFilters));
  assert.deepEqual(state.filters, emptyFilters);
  assert.equal(state.status, 'idle');
});

test('an older response cannot overwrite results for a newer search', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('old-search'));
  state = eventsReducer(state, applyFilters({ keyword: 'new search' }));
  state = eventsReducer(state, fetchEvents.pending('new-search'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'new' }]), 'new-search'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'old' }]), 'old-search'));
  state = eventsReducer(state, fetchEvents.rejected(new Error('Old error'), 'old-search'));
  assert.deepEqual(state.items, [{ id: 'new' }]);
  assert.equal(state.status, 'succeeded');
  assert.equal(state.error, '');
});

test('shrinking result counts move an unavailable page back to the last available one', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('first'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([{ id: 'one' }], 100), 'first'));
  state = eventsReducer(state, changePage(4));
  state = eventsReducer(state, fetchEvents.pending('last-page'));
  state = eventsReducer(state, fetchEvents.fulfilled(results([], 25), 'last-page'));
  assert.equal(state.page, 1);
  assert.equal(state.status, 'idle');
  assert.equal(state.startDateTime, startDateTime);
});
