import { useState, useEffect } from 'react';
import { UserService } from '@/core/services/user-service';
import type { User } from '@/core/lib/db/types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const service = UserService.getInstance();
        const currentUser = await service.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user'));
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, loading, error };
} 