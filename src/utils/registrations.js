const storageKey = 'event-management-registrations';
const textFields = ['id', 'name', 'localDate', 'localTime', 'startDateTime', 'endDateTime',
  'endLocalDate', 'timezone', 'venue', 'location', 'category', 'status'];
const flagFields = ['dateTBA', 'dateTBD', 'timeTBA', 'endApproximate', 'spanMultipleDays'];

// Save only the event information needed by My Events.
export function savedEvent(event) {
  if (!event || typeof event.id !== 'string' || !event.id || typeof event.name !== 'string' || !event.name) {
    throw new Error('Event information is missing. Please reopen its details.');
  }
  const snapshot = {};
  for (const field of textFields) snapshot[field] = typeof event[field] === 'string' ? event[field] : '';
  for (const field of flagFields) snapshot[field] = Boolean(event[field]);
  return snapshot;
}

export function readRegistrations() {
  let records;
  try {
    records = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    throw new Error('Saved registrations could not be read. Check browser storage and try again.');
  }
  const seen = new Set();
  if (!Array.isArray(records) || records.some((record) => {
    if (!record || typeof record.userId !== 'string' || !record.userId ||
        typeof record.registeredAt !== 'string' || !Number.isFinite(Date.parse(record.registeredAt)) ||
        !record.event || !record.event.id || !record.event.name ||
        !textFields.every((field) => typeof record.event[field] === 'string') ||
        !flagFields.every((field) => typeof record.event[field] === 'boolean')) return true;
    const key = JSON.stringify([record.userId, record.event.id]);
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  })) throw new Error('Saved registrations are damaged. They have not been overwritten.');
  return records;
}

export function writeRegistrations(records) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    throw new Error('Could not save registrations. Check browser storage and try again.');
  }
}

export function loadRegistrations() {
  try {
    return { items: readRegistrations(), error: '' };
  } catch (error) {
    return { items: [], error: error.message };
  }
}
