import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getEvents, getEventDetails } from '../services/ticketmaster.js';
import { cleanFilters, emptyFilters } from '../utils/eventSearch.js';

export const fetchEvents = createAsyncThunk('events/fetchEvents', (_, { getState }) => {
  const { filters, page, startDateTime } = getState().events;
  return getEvents({ filters, page, startDateTime });
}, {
  condition: (_, { getState }) => getState().events.status !== 'loading',
});

function resetResults(state) {
  state.items = [];
  state.status = 'idle';
  state.error = '';
  state.requestId = null;
}

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
    filters: emptyFilters,
    page: 0,
    totalPages: 0,
    totalElements: 0,
    startDateTime: '',
    requestId: null,
    details: { eventId: null, item: null, status: 'idle', error: '', requestId: null },
  },
  reducers: {
    applyFilters(state, action) {
      state.filters = cleanFilters(action.payload);
      state.page = 0;
      state.startDateTime = '';
      state.totalPages = 0;
      state.totalElements = 0;
      resetResults(state);
    },
    changePage(state, action) {
      const page = action.payload;
      if (state.status === 'loading' || !Number.isInteger(page) || page < 0 || page >= state.totalPages || page === state.page) return;
      state.page = page;
      resetResults(state);
    },
    refreshResults(state) {
      state.page = 0;
      state.startDateTime = '';
      state.totalPages = 0;
      state.totalElements = 0;
      resetResults(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        state.status = 'loading';
        state.error = '';
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.startDateTime = action.payload.startDateTime;
        if (state.page > 0 && state.page >= state.totalPages) {
          state.page = Math.max(0, state.totalPages - 1);
          resetResults(state);
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
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

export const { applyFilters, changePage, refreshResults } = eventsSlice.actions;
export default eventsSlice.reducer;
