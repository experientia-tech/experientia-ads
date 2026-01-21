'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { ProfileResponse } from '@/types/user';

type State = {
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'FETCH_PROFILE_START' }
  | { type: 'FETCH_PROFILE_SUCCESS'; payload: ProfileResponse }
  | { type: 'FETCH_PROFILE_ERROR'; payload: string }
  | { type: 'UPDATE_PROFILE_START' }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: ProfileResponse }
  | { type: 'UPDATE_PROFILE_ERROR'; payload: string }
  | { type: 'CLEAR_PROFILE' };

const initialState: State = {
  profile: null,
  isLoading: false,
  error: null,
};

const ProfileContext = createContext<{
  state: State;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileResponse>) => Promise<void>;
  clearProfile: () => void;
} | undefined>(undefined);

function profileReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_PROFILE_START':
    case 'UPDATE_PROFILE_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_PROFILE_SUCCESS':
    case 'UPDATE_PROFILE_SUCCESS':
      return { ...state, isLoading: false, profile: action.payload, error: null };
    case 'FETCH_PROFILE_ERROR':
    case 'UPDATE_PROFILE_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_PROFILE':
      return { ...initialState };
    default:
      return state;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  const fetchProfile = useCallback(async () => {
    dispatch({ type: 'FETCH_PROFILE_START' });
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      dispatch({ type: 'FETCH_PROFILE_SUCCESS', payload: data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      dispatch({ type: 'FETCH_PROFILE_ERROR', payload: errorMessage });
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<ProfileResponse>) => {
    dispatch({ type: 'UPDATE_PROFILE_START' });
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: updatedProfile });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      dispatch({ type: 'UPDATE_PROFILE_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const clearProfile = useCallback(() => {
    dispatch({ type: 'CLEAR_PROFILE' });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const value = {
    state,
    fetchProfile,
    updateProfile,
    clearProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}