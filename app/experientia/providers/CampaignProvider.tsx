// app/experientia/providers/CampaignProvider.tsx
'use client';

import { ReactNode } from 'react';
import { useCampaignStore } from '../store/CampaignStore';

export function CampaignProvider({ children }: { children: ReactNode }) {
  // Initialize the store
  useCampaignStore();
  return <>{children}</>;
}