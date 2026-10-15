import { Link } from 'react-router';

function Login() {
  return (
    <section className="page">
      <h1>Login</h1>
      <p>Sign in to manage your event registrations.</p>
      <p className="notice">The login form is not available yet.</p>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </section>
  );
}

export default Login;
