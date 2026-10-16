import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readAccounts, registerAccount } from '../src/utils/accounts.js';

const accountsKey = 'event-management-accounts';

beforeEach(() => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
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
