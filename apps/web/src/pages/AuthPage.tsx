import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AuthPage() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (isRegister) {
        await register(email, displayName, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-copy">
        <div>
          <p className="kicker" style={{ color: '#d7e4d4' }}>
            Expense splitter
          </p>
          <h1>Share the bill. Keep the peace.</h1>
        </div>
        <p>
          Create a group, drop in expenses, and see who owes whom — without a
          spreadsheet archaeology session.
        </p>
      </section>
      <section className="auth-panel">
        <form className="card auth-card stack" onSubmit={onSubmit}>
          <div className="tabs">
            <Link className={!isRegister ? 'active' : ''} to="/login">
              Log in
            </Link>
            <Link className={isRegister ? 'active' : ''} to="/register">
              Register
            </Link>
          </div>
          {isRegister ? (
            <label className="field">
              <span>Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                required
                autoComplete="name"
              />
            </label>
          ) : null}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 8 : 1}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={pending}>
            {pending ? 'Working…' : isRegister ? 'Create account' : 'Enter'}
          </button>
        </form>
      </section>
    </div>
  );
}
