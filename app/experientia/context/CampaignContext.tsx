'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { CreateCampaignInput } from '@/types/campaign';

type State = {
  isCreating: boolean;
  error: string | null;
  createdCampaign: any | null;
};

type Action =
  | { type: 'CREATE_CAMPAIGN_START' }
  | { type: 'CREATE_CAMPAIGN_SUCCESS'; payload: any }
  | { type: 'CREATE_CAMPAIGN_ERROR'; payload: string }
  | { type: 'RESET_CAMPAIGN_STATE' };

const initialState: State = {
  isCreating: false,
  error: null,
  createdCampaign: null,
};

const CampaignContext = createContext<{
  state: State;
  createCampaign: (data: Omit<CreateCampaignInput, 'organizationId'> & { organizationId: string }) => Promise<void>;
  reset: () => void;
} | undefined>(undefined);

function campaignReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CREATE_CAMPAIGN_START':
      return { ...state, isCreating: true, error: null };
    case 'CREATE_CAMPAIGN_SUCCESS':
      return { ...state, isCreating: false, createdCampaign: action.payload, error: null };
    case 'CREATE_CAMPAIGN_ERROR':
      return { ...state, isCreating: false, error: action.payload };
    case 'RESET_CAMPAIGN_STATE':
      return { ...initialState };
    default:
      return state;
  }
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  const createCampaign = useCallback(
    async (data: Omit<CreateCampaignInput, 'organizationId'> & { organizationId: string }) => {
      dispatch({ type: 'CREATE_CAMPAIGN_START' });
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
        dispatch({ type: 'CREATE_CAMPAIGN_SUCCESS', payload: result });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
        dispatch({ type: 'CREATE_CAMPAIGN_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_CAMPAIGN_STATE' });
  }, []);

  const value = {
    state,
    createCampaign,
    reset,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
