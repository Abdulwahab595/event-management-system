import { Link } from 'react-router';

function NotFound() {
  return (
    <section className="page">
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="button-link" to="/events">Back to events</Link>
    </section>
  );
}

export default NotFound;
