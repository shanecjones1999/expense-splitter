import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Group } from '../api/types';
import { AppNav } from '../components/AppNav';
import { formatDate } from '../lib/format';

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listGroups()
      .then((data) => {
        if (!cancelled) {
          setGroups(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load groups');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const group = await api.createGroup(name.trim());
      setGroups((current) => [group, ...current]);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <AppNav />
      <div className="page-head">
        <div>
          <p className="kicker">Your groups</p>
          <h1>Where the tab lives</h1>
        </div>
      </div>
      <form className="card panel row" onSubmit={onCreate} style={{ marginBottom: 20 }}>
        <label className="field">
          <span>New group</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Weekend trip, roommates, dinner club…"
            required
          />
        </label>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create'}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {groups.length === 0 ? (
        <div className="card empty">
          Start a group for a trip, a household, or a night out.
        </div>
      ) : (
        <div className="group-grid">
          {groups.map((group) => (
            <Link key={group.id} className="card group-card" to={`/groups/${group.id}`}>
              <div>
                <p className="kicker">{group.currency}</p>
                <h2>{group.name}</h2>
              </div>
              <p className="muted">
                {group.members?.length ?? 0} members · {formatDate(group.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
