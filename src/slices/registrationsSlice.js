import { createSlice } from '@reduxjs/toolkit';
import { readRegistrations, writeRegistrations, loadRegistrations, savedEvent } from '../utils/registrations.js';
import { eventTiming, registrationProblem } from '../utils/eventTiming.js';

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState: { items: [], error: '' },
  reducers: {
    recordsLoaded: (_, action) => action.payload,
  },
});

const { recordsLoaded } = registrationsSlice.actions;
export const reloadRegistrations = () => (dispatch) => dispatch(recordsLoaded(loadRegistrations()));

function currentUserId(getState) {
  const user = getState().auth.currentUser;
  if (!user) throw new Error('Please log in to manage registrations.');
  return user.id;
}

function save(records, dispatch) {
  // Update Redux only after storage accepts the change.
  writeRegistrations(records);
  dispatch(recordsLoaded({ items: records, error: '' }));
}

export const registerForEvent = (event) => (dispatch, getState) => {
  const userId = currentUserId(getState);
  const snapshot = savedEvent(event);
  const records = readRegistrations();
  if (records.some((record) => record.userId === userId && record.event.id === snapshot.id)) {
    throw new Error('You are already registered for this event.');
  }
  const problem = registrationProblem(snapshot);
  if (problem) throw new Error(problem);
  save([...records, { userId, event: snapshot, registeredAt: new Date().toISOString() }], dispatch);
};

export const cancelRegistration = (eventId) => (dispatch, getState) => {
  const userId = currentUserId(getState);
  const records = readRegistrations();
  const record = records.find((item) => item.userId === userId && item.event.id === eventId);
  if (!record) throw new Error('No registration was found for your account.');
  const details = getState().events.details;
  const event = details.item?.id === eventId ? details.item : record.event;
  if (eventTiming(event).group === 'completed') throw new Error('Completed registrations are kept in your history.');
  save(records.filter((item) => !(item.userId === userId && item.event.id === eventId)), dispatch);
};

export const updateSavedEvent = (event) => (dispatch) => {
  try {
    const records = readRegistrations();
    const snapshot = savedEvent(event);
    const matches = records.filter((record) => record.event.id === event.id);
    if (!matches.length || matches.every((record) => JSON.stringify(record.event) === JSON.stringify(snapshot))) return;
    save(records.map((record) => record.event.id === event.id ? { ...record, event: snapshot } : record), dispatch);
  } catch (error) {
    // Keep the existing list if refreshing its saved details fails.
    return error.message;
  }
  return '';
};

export default registrationsSlice.reducer;
