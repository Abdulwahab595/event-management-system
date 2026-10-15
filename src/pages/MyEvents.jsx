import { Link } from 'react-router';

function MyEvents() {
  return (
    <section className="page">
      <h1>My Events</h1>
      <p>View and manage your event registrations.</p>
      <p className="notice">Event registration is not available yet.</p>
      <Link className="button-link" to="/events">Browse events</Link>
    </section>
  );
}

export default MyEvents;
