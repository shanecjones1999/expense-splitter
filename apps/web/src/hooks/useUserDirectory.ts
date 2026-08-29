import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../api/types';

const cache = new Map<string, User>();

export function useUserDirectory(userIds: string[]) {
  const [users, setUsers] = useState<Record<string, User>>(() => {
    const initial: Record<string, User> = {};
    for (const id of userIds) {
      const cached = cache.get(id);
      if (cached) {
        initial[id] = cached;
      }
    }
    return initial;
  });

  useEffect(() => {
    const unique = [...new Set(userIds)].filter(Boolean);
    setUsers((current) => {
      const next = { ...current };
      let changed = false;
      for (const id of unique) {
        const cached = cache.get(id);
        if (cached && next[id] !== cached) {
          next[id] = cached;
          changed = true;
        }
      }
      return changed ? next : current;
    });

    const missing = unique.filter((id) => !cache.has(id));
    if (missing.length === 0) {
      return;
    }

    let cancelled = false;
    void Promise.all(
      missing.map(async (id) => {
        try {
          const user = await api.getUser(id);
          cache.set(id, user);
          return user;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      setUsers((current) => {
        const next = { ...current };
        for (const user of results) {
          if (user) {
            next[user.id] = user;
          }
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // IDs arrive as a new array each render; join is the stable dependency.
  }, [userIds.join('|')]);

  const nameOf = useCallback(
    (userId: string) => users[userId]?.displayName ?? 'Someone',
    [users],
  );

  const emailOf = useCallback(
    (userId: string) => users[userId]?.email,
    [users],
  );

  return { users, nameOf, emailOf };
}
