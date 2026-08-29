import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AppNav({ crumb }: { crumb?: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="mark">L</span>
        <span className="brand-name">Ledger</span>
      </Link>
      {crumb ? <span className="muted">{crumb}</span> : null}
      <div className="nav-user">
        <span>{user?.displayName}</span>
        <button className="btn btn-ghost" type="button" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
