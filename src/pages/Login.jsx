import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation } from 'react-router';
import { loginAccount } from '../utils/accounts';
import { loginSucceeded } from '../slices/authSlice';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const requestedPage = location.state?.from;
  const destination = typeof requestedPage === 'string' &&
    (requestedPage === '/my-events' || requestedPage.startsWith('/events/'))
    ? requestedPage : '/events';

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const user = await loginAccount({ email, password });
      dispatch(loginSucceeded(user));
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (currentUser) return <Navigate to={destination} replace />;

  return (
    <section className="page form-page">
      <h1>Login</h1>
      <p>Sign in to manage your event registrations.</p>
      <p className="form-note">Use the demo account you created in this browser.</p>
      {location.state?.from && <p>Please log in to continue.</p>}
      {error && <p className="message error-message" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>New here? <Link to="/register" state={location.state}>Create an account</Link></p>
    </section>
  );
}

export default Login;
