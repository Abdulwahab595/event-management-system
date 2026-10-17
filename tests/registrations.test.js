import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginSucceeded, loggedOut } from '../src/slices/authSlice.js';
import eventsReducer, { fetchEventDetails, clearEventDetails } from '../src/slices/eventsSlice.js';
import registrationsReducer, { registerForEvent, cancelRegistration, updateSavedEvent, reloadRegistrations } from '../src/slices/registrationsSlice.js';
import { readRegistrations, loadRegistrations, savedEvent } from '../src/utils/registrations.js';
import { formatEvent } from '../src/utils/eventData.js';
import { eventTiming, registrationProblem } from '../src/utils/eventTiming.js';
import { registerAccount, loginAccount } from '../src/utils/accounts.js';

const key = 'event-management-registrations';
const alice = { id: 'alice', name: 'Alice', email: 'alice@example.com' };
const bob = { id: 'bob', name: 'Bob', email: 'bob@example.com' };
const future = formatEvent({ id: 'concert', name: 'Test concert', dates: {
  start: { localDate: '2099-10-17', localTime: '18:00:00', dateTime: '2099-10-17T22:00:00Z' },
  timezone: 'America/New_York', status: { code: 'onsale' },
} });

function makeStore(user = alice) {
  return configureStore({
    reducer: { auth: authReducer, events: eventsReducer, registrations: registrationsReducer },
    preloadedState: { auth: { currentUser: user }, registrations: loadRegistrations() },
  });
}

beforeEach(() => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: (key) => saved.delete(key),
  };
});

test('registering twice saves exactly one record and excludes unrelated fields', () => {
  const store = makeStore();
  store.dispatch(registerForEvent({ ...future, password: 'not-an-event-field' }));
  assert.throws(() => store.dispatch(registerForEvent(future)), /already registered/);
  assert.equal(readRegistrations().length, 1);
  assert.equal(readRegistrations()[0].userId, alice.id);
  assert.equal(localStorage.getItem(key).includes('not-an-event-field'), false);
  assert.deepEqual(store.getState().registrations.items, readRegistrations());
});

test('guests cannot register or cancel, including after logout', () => {
  const store = makeStore(null);
  assert.throws(() => store.dispatch(registerForEvent(future)), /log in/);
  store.dispatch(loginSucceeded(alice));
  store.dispatch(registerForEvent(future));
  store.dispatch(loggedOut());
  assert.throws(() => store.dispatch(cancelRegistration(future.id)), /log in/);
  assert.equal(readRegistrations().length, 1);
});

test('two users can register for the same event and cancel only their own record', () => {
  const store = makeStore();
  store.dispatch(registerForEvent(future));
  store.dispatch(loginSucceeded(bob));
  assert.throws(() => store.dispatch(cancelRegistration(future.id)), /your account/);
  store.dispatch(registerForEvent(future));
  assert.equal(readRegistrations().length, 2);
  store.dispatch(cancelRegistration(future.id));
  assert.deepEqual(readRegistrations().map((record) => record.userId), ['alice']);
  store.dispatch(registerForEvent(future));
  assert.equal(readRegistrations().length, 2);
});

test('the real app store restores both session and event registrations after refresh', async () => {
  await registerAccount({ name: 'Test', email: 'test@example.com', password: 'sample123' });
  const user = await loginAccount({ email: 'test@example.com', password: 'sample123' });
  const first = (await import('../src/store.js?registration-first')).default;
  first.dispatch(registerForEvent(future));
  const refreshed = (await import('../src/store.js?registration-refresh')).default;
  assert.equal(refreshed.getState().auth.currentUser.id, user.id);
  assert.equal(refreshed.getState().registrations.items[0].event.id, future.id);
  refreshed.dispatch(cancelRegistration(future.id));
  const afterCancel = (await import('../src/store.js?registration-cancel')).default;
  assert.equal(afterCancel.getState().registrations.items.length, 0);
});

test('storage write failures never report a registration or cancellation as saved', () => {
  const store = makeStore();
  const write = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('Storage full'); };
  assert.throws(() => store.dispatch(registerForEvent(future)), /Could not save/);
  assert.equal(store.getState().registrations.items.length, 0);
  localStorage.setItem = write;
  store.dispatch(registerForEvent(future));
  localStorage.setItem = () => { throw new Error('Storage full'); };
  assert.throws(() => store.dispatch(cancelRegistration(future.id)), /Could not save/);
  assert.equal(store.getState().registrations.items.length, 1);
  assert.equal(readRegistrations().length, 1);
});

test('malformed saved records do not crash startup or get silently overwritten', () => {
  for (const malformed of ['not json', '{}', '[null]', JSON.stringify([{ userId: 'alice', event: future }])]) {
    localStorage.setItem(key, malformed);
    const store = makeStore();
    assert.ok(store.getState().registrations.error);
    assert.throws(() => store.dispatch(registerForEvent(future)), /read|damaged/);
    assert.equal(localStorage.getItem(key), malformed);
  }
  localStorage.removeItem(key);
  const store = makeStore();
  store.dispatch(registerForEvent(future));
  const record = readRegistrations()[0];
  localStorage.setItem(key, JSON.stringify([record, record]));
  assert.throws(readRegistrations, /damaged/);
  localStorage.setItem(key, JSON.stringify([{ ...record, event: { ...record.event, localDate: {} } }]));
  assert.throws(readRegistrations, /damaged/);
});

test('blocked reads show a recoverable error and loading can be retried', () => {
  const read = localStorage.getItem;
  localStorage.getItem = () => { throw new Error('Blocked'); };
  const store = makeStore();
  assert.match(store.getState().registrations.error, /could not be read/);
  localStorage.getItem = read;
  store.dispatch(reloadRegistrations());
  assert.equal(store.getState().registrations.error, '');
});

test('updated event details persist for all saved attendees without changing ownership', () => {
  const store = makeStore();
  store.dispatch(registerForEvent(future));
  store.dispatch(loginSucceeded(bob));
  store.dispatch(registerForEvent(future));
  const dates = readRegistrations().map((record) => record.registeredAt);
  assert.equal(store.dispatch(updateSavedEvent({ ...future, status: 'postponed' })), '');
  assert.deepEqual(readRegistrations().map((record) => record.userId), ['alice', 'bob']);
  assert.deepEqual(readRegistrations().map((record) => record.registeredAt), dates);
  assert.ok(readRegistrations().every((record) => record.event.status === 'postponed'));
  store.dispatch(cancelRegistration(future.id));
  assert.equal(readRegistrations().length, 1);
});

test('failed event snapshot updates preserve existing records and return a readable error', () => {
  const store = makeStore();
  store.dispatch(registerForEvent(future));
  localStorage.setItem = () => { throw new Error('Full'); };
  assert.match(store.dispatch(updateSavedEvent({ ...future, status: 'canceled' })), /Could not save/);
  assert.equal(store.getState().registrations.items[0].event.status, 'onsale');
});

test('cancellation uses current details and retains completed history', () => {
  const store = makeStore();
  store.dispatch(registerForEvent(future));
  const past = { ...future, startDateTime: '2000-01-01T10:00:00Z', endDateTime: '2000-01-01T12:00:00Z' };
  store.dispatch(fetchEventDetails.pending('current', future.id));
  store.dispatch(fetchEventDetails.fulfilled(past, 'current', future.id));
  assert.throws(() => store.dispatch(cancelRegistration(future.id)), /history/);
  assert.equal(readRegistrations().length, 1);
  store.dispatch(updateSavedEvent(past));
  store.dispatch(clearEventDetails());
  assert.throws(() => store.dispatch(cancelRegistration(future.id)), /history/);
});

test('unknown or unavailable registrations can still be cancelled', () => {
  for (const changes of [{ dateTBA: true }, { status: 'canceled' }, { status: 'postponed' }]) {
    const store = makeStore();
    store.dispatch(registerForEvent(future));
    store.dispatch(updateSavedEvent({ ...future, ...changes }));
    store.dispatch(cancelRegistration(future.id));
    assert.equal(readRegistrations().length, 0);
  }
});

test('registration eligibility is rechecked at action time', () => {
  const store = makeStore();
  for (const changes of [{ status: 'canceled' }, { status: 'postponed' }, { dateTBA: true },
    { timeTBA: true }, { startDateTime: '' }, { startDateTime: '2000-01-01T00:00:00Z' }]) {
    assert.throws(() => store.dispatch(registerForEvent({ ...future, ...changes })));
  }
  assert.throws(() => store.dispatch(registerForEvent({})), /information is missing/);
  assert.equal(readRegistrations().length, 0);
});

const timed = { ...future, localDate: '2026-10-17', startDateTime: '2026-10-17T22:00:00Z', endDateTime: '2026-10-18T01:00:00Z' };
test('known start and end boundaries distinguish upcoming, current and completed', () => {
  assert.equal(eventTiming(timed, Date.parse('2026-10-17T21:59:59Z')).label, 'Upcoming');
  assert.equal(registrationProblem(timed, Date.parse(timed.startDateTime)).includes('already started'), true);
  assert.equal(eventTiming(timed, Date.parse(timed.startDateTime)).label, 'In progress');
  assert.equal(eventTiming(timed, Date.parse(timed.endDateTime)).label, 'Completed');
  assert.match(eventTiming({ ...timed, endApproximate: true }, Date.parse(timed.endDateTime)).label, /estimated/);
});

test('missing end time waits until midnight in the event timezone, not Pakistan time', () => {
  const event = { ...timed, endDateTime: '', timezone: 'America/Los_Angeles', startDateTime: '2026-10-18T01:00:00Z' };
  assert.equal(eventTiming(event, Date.parse('2026-10-18T06:59:59Z')).group, 'upcoming');
  assert.match(eventTiming(event, Date.parse('2026-10-18T07:00:00Z')).label, /Completed \(estimated/);
  const winter = { ...event, localDate: '2026-12-01', startDateTime: '2026-12-02T01:00:00Z' };
  assert.equal(eventTiming(winter, Date.parse('2026-12-02T07:30:00Z')).group, 'upcoming');
  assert.equal(eventTiming(winter, Date.parse('2026-12-02T08:00:00Z')).group, 'completed');
});

test('uncertain dates, bad timezones, and open-ended multi-day events are not guessed completed', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  for (const changes of [{ dateTBA: true }, { dateTBD: true }, { timezone: '' },
    { timezone: 'Invalid/Zone' }, { spanMultipleDays: true }, { localDate: '2026-02-30' }]) {
    assert.equal(eventTiming({ ...timed, endDateTime: '', ...changes }, now).group, 'uncertain');
  }
  const multi = { ...timed, endDateTime: '', spanMultipleDays: true, endLocalDate: '2026-10-20' };
  assert.equal(eventTiming(multi, now).label, 'Event dates in progress');
  assert.equal(eventTiming(multi, Date.parse('2026-10-21T05:00:00Z')).group, 'completed');
  assert.equal(eventTiming({ ...timed, status: 'canceled' }, now).group, 'unavailable');
});

test('normalization preserves end-date information for the completion policy', () => {
  const event = formatEvent({ id: 'multi', dates: { end: { dateTime: '2026-10-18T01:00:00Z', localDate: '2026-10-17', approximate: true }, spanMultipleDays: true } });
  assert.equal(event.endDateTime, '2026-10-18T01:00:00Z');
  assert.equal(event.endLocalDate, '2026-10-17');
  assert.equal(event.endApproximate, true);
  assert.equal(event.spanMultipleDays, true);
  assert.equal(savedEvent(event).endDateTime, event.endDateTime);
  assert.equal(formatEvent({ id: 'unknown', dates: { end: { dateTime: '2026-10-18T01:00:00Z', noSpecificTime: true } } }).endDateTime, '');
});
