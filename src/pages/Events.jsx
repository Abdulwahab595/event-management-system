import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../slices/eventsSlice';

function Events() {
  const { items, status, error } = useSelector((state) => state.events);
  const dispatch = useDispatch();
  useEffect(() => {
    if (status === 'idle') dispatch(fetchEvents());
  }, [dispatch, status]);

  return (
    <section className="page">
      <h1>Explore Events</h1>
      <p>Upcoming events from Ticketmaster. Dates and times are local to each event.</p>
      {(status === 'idle' || status === 'loading') && <p role="status">Loading events...</p>}
      {status === 'failed' && (
        <div>
          <p className="message error-message" role="alert">{error}</p>
          <button type="button" onClick={() => dispatch(fetchEvents())}>Try again</button>
        </div>
      )}
      {status === 'succeeded' && (
        <>
          <p>{items.length ? `Showing the next ${items.length} events.` : 'No upcoming events were found.'}</p>
          <div className="event-grid">
            {items.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
          <button className="refresh-button" type="button" onClick={() => dispatch(fetchEvents())}>Refresh events</button>
        </>
      )}
    </section>
  );
}

export default Events;
