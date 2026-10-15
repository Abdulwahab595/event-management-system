import { Link } from 'react-router';

function EventDetails() {
  return (
    <section className="page">
      <h1>Event Details</h1>
      <p className="notice">Event details are not available yet.</p>
      <Link className="button-link" to="/events">Back to events</Link>
    </section>
  );
}

export default EventDetails;
