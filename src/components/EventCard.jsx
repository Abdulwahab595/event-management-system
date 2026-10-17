import { Link } from 'react-router';
import EventImage from './EventImage';
import { eventSchedule } from '../utils/eventData';

function EventCard({ event }) {
  return (
    <article className="event-card">
      <EventImage src={event.image} name={event.name} />
      <div className="event-card-content">
        <p className="event-category">{event.category}</p>
        <h2><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link></h2>
        <p>{eventSchedule(event)}</p>
        <p>{event.venue}<br />{event.location}</p>
        <Link className="button-link" to={`/events/${encodeURIComponent(event.id)}`}>View details</Link>
      </div>
    </article>
  );
}

export default EventCard;
