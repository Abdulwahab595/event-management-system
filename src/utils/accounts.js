const accountsKey = 'event-management-accounts';

export function readAccounts() {
  try {
    const saved = localStorage.getItem(accountsKey);
    const accounts = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(accounts) || accounts.some((account) =>
      !account ||
      typeof account.id !== 'string' ||
      typeof account.name !== 'string' ||
      typeof account.email !== 'string' ||
      typeof account.passwordHash !== 'string' ||
      !/^[a-f0-9]{64}$/.test(account.passwordHash)
    )) {
      throw new Error('Invalid account data');
    }

    return accounts;
  } catch {
    throw new Error('Saved accounts could not be read. Check your browser storage settings.');
  }
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function registerAccount({ name, email, password }) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Please enter your name.');
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  if (typeof password !== 'string' || password.length < 6 || !password.trim()) {
    throw new Error('Please enter a password with at least 6 characters.');
  }

  const cleanEmail = email.trim().toLowerCase();
  let passwordHash;

  try {
    passwordHash = await hashPassword(password);
  } catch {
    throw new Error('Password processing failed. Open the app on localhost or HTTPS and try again.');
  }

  // Read after hashing so another completed registration is included.
  const accounts = readAccounts();

  if (accounts.some((account) => account.email === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
  };

  try {
    localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]));
  } catch {
    throw new Error('The account could not be saved. Allow browser storage and try again.');
  }

  return { id: account.id, name: account.name, email: account.email };
}
