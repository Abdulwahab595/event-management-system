import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router';
import EventImage from '../components/EventImage';
import RegistrationActions from '../components/RegistrationActions';
import { fetchEventDetails, clearEventDetails } from '../slices/eventsSlice';
import { updateSavedEvent } from '../slices/registrationsSlice';
import { eventSchedule } from '../utils/eventData';

function EventDetails() {
  const { eventId } = useParams();
  const details = useSelector((state) => state.events.details);
  const user = useSelector((state) => state.auth.currentUser);
  const [saveError, setSaveError] = useState('');
  const dispatch = useDispatch();
  useEffect(() => { dispatch(fetchEventDetails(eventId)); }, [dispatch, eventId]);
  const event = details.eventId === eventId ? details.item : null;
  const loading = details.eventId !== eventId || details.status === 'idle' || details.status === 'loading';
  useEffect(() => {
    setSaveError(event ? dispatch(updateSavedEvent(event)) || '' : '');
  }, [dispatch, event]);

  return (
    <section className="page">
      <Link to="/events">Back to events</Link>
      {loading && <p role="status">Loading event details...</p>}
      {!loading && details.status === 'failed' && (
        <div>
          <h1>Event Details</h1>
          <p className="message error-message" role="alert">{details.error}</p>
          <button type="button" onClick={() => dispatch(fetchEventDetails(eventId))}>Try again</button>
        </div>
      )}
      {event && (
        <div className="event-details">
          <h1>{event.name}</h1>
          <EventImage src={event.image} name={event.name} />
          <dl>
            <dt>Date and time</dt><dd>{eventSchedule(event)}</dd>
            <dt>Venue</dt><dd>{event.venue}</dd>
            <dt>Location</dt><dd>{event.address && <>{event.address}<br /></>}{event.location}</dd>
            <dt>Category</dt><dd>{event.category}{event.genre && ` / ${event.genre}`}</dd>
            <dt>Status</dt><dd>{event.statusLabel}</dd>
            <dt>Listed price</dt><dd>{event.price}</dd>
          </dl>
          {event.description && <><h2>About this event</h2><p className="event-description">{event.description}</p></>}
          {event.note && <><h2>Please note</h2><p className="event-description">{event.note}</p></>}
          {event.url && <p><a href={event.url} target="_blank" rel="noopener noreferrer">View on Ticketmaster</a></p>}
          <button type="button" className="secondary-button" onClick={() => {
            dispatch(clearEventDetails());
            dispatch(fetchEventDetails(eventId));
          }}>Refresh details</button>
          {saveError && <p className="message error-message" role="alert">The latest details are shown, but your saved list could not be updated. {saveError}</p>}
          <RegistrationActions key={`${event.id}-${user?.id || 'guest'}`} event={event} />
        </div>
      )}
    </section>
  );
}

export default EventDetails;
