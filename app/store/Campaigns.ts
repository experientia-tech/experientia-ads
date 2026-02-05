import { create } from "zustand";
import { ICampaign } from "../constants/interface";
import { authenticatedFetch } from "../constants/api";

interface CampaignState {
  campaigns: ICampaign[];
  selectedCampaign: ICampaign | null;
  isLoading: boolean;
  error: string | null;

  fetchCampaigns: () => Promise<{
    success: boolean;
    data?: ICampaign[];
    error?: string;
  }>;
  fetchCampaignById: (
    id: string,
  ) => Promise<{ success: boolean; data?: ICampaign; error?: string }>;
  clearError: () => void;

  setCampaigns: (campaigns: ICampaign[]) => void;

  //Edit Campaign
  editCampaign: (
    id: string,
    data: Partial<ICampaign>,
  ) => Promise<{ success: boolean; data?: ICampaign; error?: string }>;

  //search campaign
  searchCampaign: (search: string) => Promise<{
    success: boolean;
    data?: ICampaign[];
    error?: string;
  }>;
}

export const useCampaignStore = create<CampaignState>((set) => ({
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  error: null,

  setCampaigns: (campaigns) => set({ campaigns }),

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch("/api/campaigns");

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch campaigns: ${response.status} ${response.statusText}`;
        console.error("API Error:", errorText);
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      let campaignsData: ICampaign[] = [];
      if (Array.isArray(responseData)) {
        campaignsData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data.data)) {
        campaignsData = responseData.data.data;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        campaignsData = responseData.data;
      } else if (responseData.campaigns) {
        campaignsData = responseData.campaigns;
      }

      set({ campaigns: campaignsData, isLoading: false });
      return { success: true, data: campaignsData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching campaigns:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage, data: [] };
    }
  },

  fetchCampaignById: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(`/api/campaigns/${campaignId}`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch campaign: ${response.status} ${response.statusText}`;
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      const campaignData = responseData.data || responseData;
      set({ selectedCampaign: campaignData, isLoading: false });
      return { success: true, data: campaignData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching campaign:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),

  editCampaign: async (campaignId: string, data: Partial<ICampaign>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(
        `/api/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to edit campaign: ${response.status} ${response.statusText}`;
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      const campaignData = responseData.data || responseData;
      set({ selectedCampaign: campaignData, isLoading: false });
      return { success: true, data: campaignData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error editing campaign:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  searchCampaign: async (search: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(
        `/api/campaigns?search=${search}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to search campaign: ${response.status} ${response.statusText}`;
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      const campaignData = responseData.data || responseData;
      set({ selectedCampaign: campaignData, isLoading: false });
      return { success: true, data: campaignData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error searching campaign:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

export const fetchCampaigns = () =>
  useCampaignStore.getState().fetchCampaigns();
export const fetchCampaignById = (id: string) =>
  useCampaignStore.getState().fetchCampaignById(id);
