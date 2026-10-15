import { Link } from 'react-router';

function Register() {
  return (
    <section className="page">
      <h1>Create an Account</h1>
      <p>Create an account to register for events.</p>
      <p className="notice">The account registration form is not available yet.</p>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </section>
  );
}

export default Register;
