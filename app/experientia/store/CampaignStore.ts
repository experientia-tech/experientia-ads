// app/experientia/store/CampaignStore.ts
import { create } from 'zustand';
import { CreateCampaignInput } from '@/types/campaign';

interface CampaignStore {
  isCreating: boolean;
  error: string | null;
  createdCampaign: any | null;
  createCampaign: (data: Omit<CreateCampaignInput, 'organizationId'> & { organizationId: string }) => Promise<void>;
  reset: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  isCreating: false,
  error: null,
  createdCampaign: null,

  createCampaign: async (data) => {
    set({ isCreating: true, error: null });
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const result = await response.json();
      set({ createdCampaign: result, isCreating: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
      set({ error: errorMessage, isCreating: false });
      throw error;
    }
  },

  reset: () => set({ 
    isCreating: false, 
    error: null, 
    createdCampaign: null 
  }),
}));