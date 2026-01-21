// app/providers/ProfileProvider.tsx
'use client';

import { useEffect } from 'react';
import { useProfileStore } from '@/app/experientia/store/useProfileStore';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    // Fetch profile when component mounts
    fetchProfile().catch(console.error);

    // Clean up on unmount
    return () => {
      clearProfile();
    };
  }, [fetchProfile, clearProfile]);

  return <>{children}</>;
}