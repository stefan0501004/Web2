import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/dashboard">TravelApp</Link>
        <div className="d-flex align-items-center gap-3">
          {user?.isAdmin && (
            <Link className="nav-link fw-medium" to="/admin">Admin</Link>
          )}
          <span className="text-muted small">{user?.fullName}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
