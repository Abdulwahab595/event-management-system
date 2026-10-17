import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readAccounts, registerAccount, loginAccount, readCurrentUser, logoutAccount } from '../src/utils/accounts.js';
import { loginSucceeded, loggedOut } from '../src/slices/authSlice.js';

const accountsKey = 'event-management-accounts';
const sessionKey = 'event-management-current-user';

beforeEach(() => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: (key) => saved.delete(key),
  };
});

test('registration normalizes the name and email without saving the entered password', async () => {
  const user = await registerAccount({
    name: '  Test Student  ',
    email: '  STUDENT@example.com  ',
    password: 'sample123',
  });

  assert.equal(user.name, 'Test Student');
  assert.equal(user.email, 'student@example.com');
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name']);
  assert.equal(readAccounts().length, 1);
  assert.equal(localStorage.getItem(accountsKey).includes('sample123'), false);
});

test('invalid fields do not create accounts', async () => {
  const valid = { name: 'Test Student', email: 'student@example.com', password: 'sample123' };
  await assert.rejects(registerAccount({ ...valid, name: '  ' }), /name/);
  await assert.rejects(registerAccount({ ...valid, email: 'invalid-email' }), /valid email/);
  await assert.rejects(registerAccount({ ...valid, password: 'short' }), /6 characters/);
  await assert.rejects(registerAccount({ ...valid, password: '      ' }), /6 characters/);
  assert.equal(readAccounts().length, 0);
});

test('duplicate email is rejected regardless of casing and spaces', async () => {
  await registerAccount({ name: 'First', email: 'student@example.com', password: 'sample123' });
  await assert.rejects(
    registerAccount({ name: 'Second', email: ' STUDENT@EXAMPLE.COM ', password: 'different123' }),
    /already exists/,
  );
  assert.equal(readAccounts().length, 1);
});

test('overlapping duplicate requests create only one account', async () => {
  const details = { name: 'Test Student', email: 'student@example.com', password: 'sample123' };
  const results = await Promise.allSettled([registerAccount(details), registerAccount(details)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(readAccounts().length, 1);
});

test('different users are saved without replacing each other', async () => {
  const first = await registerAccount({ name: 'First', email: 'first@example.com', password: 'sample123' });
  const second = await registerAccount({ name: 'Second', email: 'second@example.com', password: 'sample123' });
  assert.notEqual(first.id, second.id);
  assert.equal(readAccounts().length, 2);
});

test('malformed stored accounts produce an error and are not overwritten', async () => {
  for (const saved of ['not json', '{}', '[null]']) {
    localStorage.setItem(accountsKey, saved);
    await assert.rejects(
      registerAccount({ name: 'Test Student', email: 'student@example.com', password: 'sample123' }),
      /could not be read/,
    );
    assert.equal(localStorage.getItem(accountsKey), saved);
  }
});

test('failed storage does not report successful registration', async () => {
  localStorage.setItem = () => { throw new Error('Storage blocked'); };
  await assert.rejects(
    registerAccount({ name: 'Test Student', email: 'student@example.com', password: 'sample123' }),
    /could not be saved/,
  );
});

test('login normalizes the email and remembers only the account ID', async () => {
  const details = { name: 'First', email: 'first@example.com', password: ' sample123 ' };
  const account = await registerAccount(details);
  assert.equal(readCurrentUser(), null);
  const user = await loginAccount({ ...details, email: ' FIRST@EXAMPLE.COM ' });
  assert.deepEqual(user, account);
  assert.equal(localStorage.getItem(sessionKey), account.id);
  assert.deepEqual(Object.keys(readCurrentUser()).sort(), ['email', 'id', 'name']);
  await assert.rejects(loginAccount({ ...details, password: 'sample123' }), /incorrect/);
});

test('incorrect or unknown credentials do not create a session', async () => {
  await registerAccount({ name: 'First', email: 'first@example.com', password: 'sample123' });
  await assert.rejects(loginAccount({ email: 'first@example.com', password: 'wrong123' }), /incorrect/);
  await assert.rejects(loginAccount({ email: 'unknown@example.com', password: 'sample123' }), /incorrect/);
  assert.equal(readCurrentUser(), null);
  assert.equal(localStorage.getItem(sessionKey), null);
});

test('login requires a valid email and nonblank password', async () => {
  await assert.rejects(loginAccount({ email: '', password: 'sample123' }), /valid email/);
  await assert.rejects(loginAccount({ email: 'not-an-email', password: 'sample123' }), /valid email/);
  await assert.rejects(loginAccount({ email: 'first@example.com', password: '   ' }), /password/);
  assert.equal(readCurrentUser(), null);
});

test('Redux login and logout agree with a freshly loaded store', async () => {
  const details = { name: 'First', email: 'first@example.com', password: 'sample123' };
  const account = await registerAccount(details);
  const { default: store } = await import('../src/store.js?before-login');
  assert.equal(store.getState().auth.currentUser, null);

  const user = await loginAccount(details);
  store.dispatch(loginSucceeded(user));
  assert.deepEqual(store.getState().auth.currentUser, account);
  const { default: refreshed } = await import('../src/store.js?after-login');
  assert.deepEqual(refreshed.getState().auth.currentUser, account);
  assert.equal(JSON.stringify(store.getState()).includes('password'), false);

  logoutAccount();
  store.dispatch(loggedOut());
  assert.equal(store.getState().auth.currentUser, null);
  const { default: afterLogout } = await import('../src/store.js?after-logout');
  assert.equal(afterLogout.getState().auth.currentUser, null);
  assert.equal(readAccounts().length, 1);
});

test('switching accounts restores only the last signed-in user', async () => {
  const first = { name: 'First', email: 'first@example.com', password: 'sample123' };
  const second = { name: 'Second', email: 'second@example.com', password: 'another123' };
  await registerAccount(first);
  const secondUser = await registerAccount(second);
  await loginAccount(first);
  logoutAccount();
  await loginAccount(second);
  assert.deepEqual(readCurrentUser(), secondUser);
  assert.equal(readAccounts().length, 2);
});

test('missing, stale or damaged saved accounts restore a guest session', async () => {
  assert.equal(readCurrentUser(), null);
  localStorage.setItem(sessionKey, 'missing-account');
  assert.equal(readCurrentUser(), null);
  localStorage.setItem(accountsKey, 'invalid-json');
  assert.equal(readCurrentUser(), null);
  localStorage.getItem = () => { throw new Error('Storage blocked'); };
  assert.equal(readCurrentUser(), null);
});

test('failed session storage does not report successful login', async () => {
  const details = { name: 'First', email: 'first@example.com', password: 'sample123' };
  await registerAccount(details);
  localStorage.setItem = () => { throw new Error('Storage full'); };
  await assert.rejects(loginAccount(details), /Login could not be saved/);
  assert.equal(readCurrentUser(), null);
});

test('failed logout reports the problem and retains the saved session', async () => {
  const details = { name: 'First', email: 'first@example.com', password: 'sample123' };
  const user = await registerAccount(details);
  await loginAccount(details);
  localStorage.removeItem = () => { throw new Error('Storage blocked'); };
  assert.throws(logoutAccount, /Logout could not be saved/);
  assert.deepEqual(readCurrentUser(), user);
});
