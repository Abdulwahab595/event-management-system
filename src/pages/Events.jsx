import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import { applyFilters, changePage, fetchEvents, refreshResults } from '../slices/eventsSlice';
import { MAX_PAGES, PAGE_SIZE } from '../utils/eventSearch';

function Events() {
  const { items, status, error, filters, page, totalPages, totalElements } = useSelector((state) => state.events);
  const dispatch = useDispatch();
  useEffect(() => {
    if (status === 'idle') dispatch(fetchEvents());
  }, [dispatch, status]);

  return (
    <section className="page">
      <h1>Explore Events</h1>
      <p>Upcoming events from Ticketmaster. Dates and times are local to each event.</p>
      <EventFilters filters={filters} loading={status === 'loading'} onSearch={(values) => dispatch(applyFilters(values))} />
      {(status === 'idle' || status === 'loading') && <p role="status">Loading events...</p>}
      {status === 'failed' && (
        <div>
          <p className="message error-message" role="alert">{error}</p>
          <button type="button" onClick={() => dispatch(fetchEvents())}>Try again</button>
        </div>
      )}
      {status === 'succeeded' && (
        <>
          <p role="status">{items.length ? `${totalElements.toLocaleString()} matching upcoming events.` : 'No upcoming events match your search. Try another keyword or clear the filters.'}</p>
          {totalElements > PAGE_SIZE * MAX_PAGES && <p className="form-note">Only the first 1,000 results are available. Narrow your search to find more specific events.</p>}
          <div className="event-grid">
            {items.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
          {totalPages > 0 && (
            <div className="pagination" role="group" aria-label="Event pages">
              <button type="button" disabled={page === 0} onClick={() => dispatch(changePage(page - 1))}>Previous</button>
              <span>Page {page + 1} of {totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => dispatch(changePage(page + 1))}>Next</button>
            </div>
          )}
          <button className="refresh-button" type="button" onClick={() => dispatch(refreshResults())}>Refresh events</button>
        </>
      )}
    </section>
  );
}

export default Events;
