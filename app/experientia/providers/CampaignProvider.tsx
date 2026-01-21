'use client';

import { ReactNode } from 'react';
import { CampaignProvider as Provider } from '@/app/experientia/context/CampaignContext';

export function CampaignProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}