import { create } from 'zustand';
import { ProfileResponse } from '@/types/user';

interface ProfileState {
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileResponse>) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const profile = await response.json();
      set({ profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        isLoading: false 
      });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      set((state) => ({ 
        profile: { ...state.profile, ...updatedProfile },
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false 
      });
      throw error;
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));