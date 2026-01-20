'use client';

import { useEffect } from 'react';
import { useProfileStore } from '../store/useProfileStore';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return <>{children}</>;
}