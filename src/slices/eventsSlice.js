import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getEvents, getEventDetails } from '../services/ticketmaster.js';

export const fetchEvents = createAsyncThunk('events/fetchEvents', getEvents, {
  condition: (_, { getState }) => getState().events.status !== 'loading',
});

export const fetchEventDetails = createAsyncThunk('events/fetchDetails', getEventDetails, {
  condition: (id, { getState }) => {
    const details = getState().events.details;
    return details.eventId !== id || details.status === 'idle' || details.status === 'failed';
  },
});

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    status: 'idle',
    error: '',
    details: { eventId: null, item: null, status: 'idle', error: '', requestId: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading';
        state.error = '';
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Could not load events.';
      })
      .addCase(fetchEventDetails.pending, (state, action) => {
        state.details = {
          eventId: action.meta.arg, item: null, status: 'loading',
          error: '', requestId: action.meta.requestId,
        };
      })
      .addCase(fetchEventDetails.fulfilled, (state, action) => {
        if (state.details.requestId !== action.meta.requestId) return;
        state.details.status = 'succeeded';
        state.details.item = action.payload;
      })
      .addCase(fetchEventDetails.rejected, (state, action) => {
        if (state.details.requestId !== action.meta.requestId) return;
        state.details.status = 'failed';
        state.details.error = action.error.message || 'Could not load this event.';
      });
  },
});

export default eventsSlice.reducer;
