import { useState } from 'react';
import { Link } from 'react-router';
import { registerAccount } from '../utils/accounts';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const account = await registerAccount({ name, email, password });
      setSuccess(`Account created for ${account.name}. Your details are saved in this browser.`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page form-page">
      <h1>Create an Account</h1>
      <p>Create an account to register for events.</p>
      <p className="form-note">This is a class project. Use a sample password, not a real account password.</p>

      {error && <p className="message error-message" role="alert">{error}</p>}
      {success && <p className="message success-message" role="status">{success}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-help"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <small id="password-help">Use at least 6 characters.</small>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p>Already have an account? <Link to="/login">Login</Link></p>
    </section>
  );
}

export default Register;
