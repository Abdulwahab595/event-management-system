import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { cancelRegistration, registerForEvent } from '../slices/registrationsSlice';
import { eventTiming, registrationProblem } from '../utils/eventTiming';
import useNow from '../hooks/useNow';

function RegistrationActions({ event }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.currentUser);
  const registered = useSelector((state) => state.registrations.items.some(
    (record) => record.userId === user?.id && record.event.id === event.id,
  ));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const now = useNow();
  const problem = registrationProblem(event, now);
  const completed = eventTiming(event, now).group === 'completed';

  function handleAction(cancel) {
    setMessage('');
    setError('');
    try {
      dispatch(cancel ? cancelRegistration(event.id) : registerForEvent(event));
      setMessage(cancel ? 'Your registration has been cancelled.' : 'You have registered for this event.');
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="registration-section" aria-label="Event registration">
      <h2>Event registration</h2>
      <p className="form-note">This saves your registration in this app. It does not book a ticket.</p>
      {message && <p className="message success-message" role="status">{message}</p>}
      {error && <p className="message error-message" role="alert">{error}</p>}
      {registered ? (
        <>
          <p>You are registered for this event. <Link to="/my-events">View My Events</Link></p>
          {completed ? <p>Completed registrations are kept in your history.</p> : (
            <button type="button" className="secondary-button" onClick={() => handleAction(true)}>Cancel registration</button>
          )}
        </>
      ) : problem ? <p className="notice">{problem}</p> : user ? (
        <button type="button" onClick={() => handleAction(false)}>Register for event</button>
      ) : (
        <Link className="button-link" to="/login" state={{ from: `/events/${encodeURIComponent(event.id)}` }}>Log in to register</Link>
      )}
    </section>
  );
}

export default RegistrationActions;
