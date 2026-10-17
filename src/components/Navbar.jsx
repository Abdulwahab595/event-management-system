import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router';
import { logoutAccount } from '../utils/accounts';
import { loggedOut } from '../slices/authSlice';

function Navbar() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [error, setError] = useState('');

  function handleLogout() {
    setError('');
    try {
      logoutAccount();
      dispatch(loggedOut());
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <header>
      <div className="nav-container">
        <Link className="site-title" to="/events">
          Event Management System
        </Link>

        <nav aria-label="Main navigation">
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/my-events">My Events</NavLink>
          {currentUser ? (
            <button type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>

        <span className="user-status">
          {currentUser ? currentUser.name : 'Guest'}
        </span>
      </div>
      {error && <p className="message error-message nav-error" role="alert">{error}</p>}
    </header>
  );
}

export default Navbar;
