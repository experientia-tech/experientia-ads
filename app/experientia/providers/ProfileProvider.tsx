'use client';

import { useEffect } from 'react';
import { ProfileProvider as Provider } from '@/app/experientia/context/ProfileContext';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}