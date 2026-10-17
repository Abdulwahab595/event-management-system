import { formatEvent } from '../utils/eventData.js';

const baseUrl = 'https://app.ticketmaster.com/discovery/v2';
let nextRequest = Promise.resolve();

async function request(path, parameters = {}) {
  const apiKey = import.meta.env?.VITE_TICKETMASTER_API_KEY?.trim();
  if (!apiKey) throw new Error('The event service is not configured yet.');

  // Space request starts to stay below the assignment's two-per-second limit.
  const turn = nextRequest;
  nextRequest = turn.then(() => new Promise((resolve) => setTimeout(resolve, 600)));
  await turn;

  const query = new URLSearchParams({ ...parameters, apikey: apiKey });
  let response;
  try {
    response = await fetch(`${baseUrl}${path}?${query}`, { signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error('Could not reach Ticketmaster. Check your connection and try again.');
  }

  if (response.status === 404) throw new Error('This event could not be found.');
  if (response.status === 400) throw new Error('The event request was not accepted. Please try another event.');
  if (response.status === 401 || response.status === 403) {
    throw new Error('The event service could not authorize this request. Please try again later.');
  }
  if (response.status === 429) throw new Error('Too many event requests. Wait a moment and try again.');
  if (!response.ok) throw new Error('Ticketmaster is unavailable. Please try again later.');

  try {
    return await response.json();
  } catch {
    throw new Error('Ticketmaster returned an unreadable response. Please try again.');
  }
}

export async function getEvents() {
  const data = await request('/events.json', {
    size: '12',
    sort: 'date,asc',
    startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  });
  const events = data._embedded?.events || [];
  if (!Array.isArray(events)) throw new Error('The event list could not be read. Please try again.');
  return events.filter((event) => event && typeof event.id === 'string').map(formatEvent);
}

export async function getEventDetails(id) {
  const data = await request(`/events/${encodeURIComponent(id)}.json`);
  if (data.id !== id) throw new Error('The requested event details are unavailable.');
  return formatEvent(data);
}
