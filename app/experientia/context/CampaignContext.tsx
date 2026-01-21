'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { CreateCampaignInput } from '@/types/campaign';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  status: string;
  address: string;
  serviceType: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  members: any[];
  tasks: any[];
  createdAt: string;
  updatedAt: string;
}

type State = {
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;
  createdCampaign: any | null;
  campaigns: Campaign[];
};

type Action =
  | { type: 'FETCH_CAMPAIGNS_START' }
  | { type: 'FETCH_CAMPAIGNS_SUCCESS'; payload: Campaign[] }
  | { type: 'FETCH_CAMPAIGNS_ERROR'; payload: string }
  | { type: 'CREATE_CAMPAIGN_START' }
  | { type: 'CREATE_CAMPAIGN_SUCCESS'; payload: any }
  | { type: 'CREATE_CAMPAIGN_ERROR'; payload: string }
  | { type: 'RESET_CAMPAIGN_STATE' };

const initialState: State = {
  isCreating: false,
  isLoading: false,
  error: null,
  createdCampaign: null,
  campaigns: [],
};

interface CampaignContextType {
  state: State;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: Omit<CreateCampaignInput, 'organizationId'> & { organizationId: string }) => Promise<void>;
  reset: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

function campaignReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_CAMPAIGNS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_CAMPAIGNS_SUCCESS':
      return { ...state, isLoading: false, campaigns: action.payload, error: null };
    case 'FETCH_CAMPAIGNS_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CREATE_CAMPAIGN_START':
      return { ...state, isCreating: true, error: null };
    case 'CREATE_CAMPAIGN_SUCCESS':
      return { 
        ...state, 
        isCreating: false, 
        createdCampaign: action.payload, 
        campaigns: [action.payload, ...state.campaigns],
        error: null 
      };
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

  const fetchCampaigns = useCallback(async () => {
    dispatch({ type: 'FETCH_CAMPAIGNS_START' });
    try {
      const profileResponse = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await profileResponse.json();
      const orgId = profile.organizationId;

      if (!orgId) {
        throw new Error('User is not associated with any organization');
      }

      const response = await fetch(`/api/campaigns?organizationId=${orgId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch campaigns');
      }

      const result = await response.json();
      dispatch({ type: 'FETCH_CAMPAIGNS_SUCCESS', payload: result.data || [] });
      return result.data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      dispatch({ type: 'FETCH_CAMPAIGNS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

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

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const value = {
    state,
    fetchCampaigns,
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
