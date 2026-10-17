import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { cancelRegistration, reloadRegistrations } from '../slices/registrationsSlice';
import { eventSchedule } from '../utils/eventData';
import { eventTiming } from '../utils/eventTiming';
import useNow from '../hooks/useNow';

const groups = [
  ['upcoming', 'Upcoming and current events'],
  ['completed', 'Completed events'],
  ['uncertain', 'Unconfirmed schedules'],
  ['unavailable', 'Cancelled or postponed events'],
];

function MyEvents() {
  const user = useSelector((state) => state.auth.currentUser);
  return user ? <PersonalEvents key={user.id} userId={user.id} /> : null;
}

function PersonalEvents({ userId }) {
  const dispatch = useDispatch();
  const { items, error: storageError } = useSelector((state) => state.registrations);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const now = useNow();
  const records = items.filter((record) => record.userId === userId).map((record) => ({
    ...record, timing: eventTiming(record.event, now),
  }));

  function cancel(event) {
    setMessage('');
    setError('');
    try {
      dispatch(cancelRegistration(event.id));
      setMessage(`Your registration for ${event.name} has been cancelled.`);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="page">
      <h1>My Events</h1>
      <p>View and manage your event registrations.</p>
      <Link to="/events">Browse events</Link>
      {message && <p className="message success-message" role="status">{message}</p>}
      {error && <p className="message error-message" role="alert">{error}</p>}
      {storageError && <div>
        <p className="message error-message" role="alert">{storageError}</p>
        <button type="button" onClick={() => dispatch(reloadRegistrations())}>Try loading registrations again</button>
      </div>}
      {!storageError && records.length === 0 && <p className="notice">You have not registered for any events yet.</p>}
      {records.length > 0 && <p className="form-note">These are your saved event details. Open an event and use Refresh details to check for schedule changes. Completion uses the listed end time, or an estimate after the event's final local date.</p>}
      {groups.map(([group, heading]) => {
        const matches = records.filter((record) => record.timing.group === group);
        if (!matches.length && group !== 'upcoming' && group !== 'completed') return null;
        if (!records.length) return null;
        return <section className="my-events-group" key={group}>
          <h2>{heading} ({matches.length})</h2>
          {!matches.length && <p>No events in this section.</p>}
          {matches.map(({ event, timing }) => <article className="saved-event" key={event.id}>
            <h3><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link></h3>
            <p>{eventSchedule(event)}<br />{event.venue} — {event.location}</p>
            <p>{event.category} · {timing.label}</p>
            {group !== 'completed' && <button type="button" className="secondary-button" onClick={() => cancel(event)}
              aria-label={`Cancel registration for ${event.name}`}>Cancel registration</button>}
          </article>)}
        </section>;
      })}
    </section>
  );
}

export default MyEvents;
