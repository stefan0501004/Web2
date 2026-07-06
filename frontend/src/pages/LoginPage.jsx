import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import ErrorMessage from '../components/common/ErrorMessage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authService.login(email, password);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex">
      <div
        className="d-none d-md-flex flex-column justify-content-center text-white p-5"
        style={{ width: '42%', background: 'linear-gradient(160deg, #1f6f5c, #124a3d)' }}
      >
        <h1 className="fw-bold mb-3">TravelApp</h1>
        <p className="fs-5 mb-0">
          Plan your trips, track your budget, and share the journey with the people who matter.
        </p>
      </div>
      <div className="d-flex align-items-center justify-content-center p-4" style={{ width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h3 className="fw-bold mb-1">Welcome back</h3>
          <p className="text-muted mb-4">Sign in to your account</p>
          <ErrorMessage message={error} />
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center mt-3 mb-0 text-muted">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
