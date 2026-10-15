import { useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router';

function Navbar() {
  const currentUser = useSelector((state) => state.auth.currentUser);

  return (
    <header>
      <div className="nav-container">
        <Link className="site-title" to="/events">
          Event Management System
        </Link>

        <nav aria-label="Main navigation">
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/my-events">My Events</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>

        <span className="user-status">
          {currentUser ? currentUser.name : 'Guest'}
        </span>
      </div>
    </header>
  );
}

export default Navbar;
