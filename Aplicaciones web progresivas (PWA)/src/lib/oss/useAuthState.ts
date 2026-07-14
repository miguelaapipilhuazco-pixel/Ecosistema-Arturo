import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, type User } from './auth';

export function useAuthState(_auth: typeof auth): [User | null, boolean, undefined] {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return [user, loading, undefined];
}
