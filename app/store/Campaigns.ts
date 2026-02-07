import { create } from "zustand";
import { ICampaign } from "../constants/interface";
import { authenticatedFetch } from "../constants/api";

interface CampaignState {
  campaigns: ICampaign[];
  selectedCampaign: ICampaign | null;
  isLoading: boolean;
  error: string | null;

  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  fetchCampaigns: (page?: number, limit?: number, filters?: { scope?: string; status?: string }) => Promise<{
    success: boolean;
    data?: ICampaign[];
    error?: string;
  }>;
  fetchMyCampaigns: (page?: number, limit?: number, filters?: { status?: string }) => Promise<{
    success: boolean;
    data?: ICampaign[];
    error?: string;
  }>;
  fetchAssignedCampaigns: (page?: number, limit?: number, filters?: { status?: string; serviceType?: string }) => Promise<{
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

  //filter campaigns
  filterCampaigns: (filters: Record<string, string>) => Promise<{
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
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },

  setCampaigns: (campaigns) => set({ campaigns }),

  fetchCampaigns: async (page = 1, limit = 10, filters?: { scope?: string; status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.scope) queryParams.append('scope', filters.scope);
      if (filters?.status) queryParams.append('status', filters.status);

      const response = await authenticatedFetch(`/api/campaigns?${queryParams.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch campaigns: ${response.status} ${response.statusText}`;
        console.error("API Error:", errorText);
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      let campaignsData: ICampaign[] = [];
      let paginationData = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      if (responseData.data && Array.isArray(responseData.data)) {
        campaignsData = responseData.data;
        if (responseData.pagination) {
          paginationData = responseData.pagination;
        }
      } else if (Array.isArray(responseData)) {
        campaignsData = responseData;
      }

      set({
        campaigns: campaignsData,
        pagination: paginationData,
        isLoading: false
      });
      return { success: true, data: campaignsData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching campaigns:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage, data: [] };
    }
  },

  fetchMyCampaigns: async (page = 1, limit = 10, filters?: { status?: string; serviceType?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.serviceType && filters.serviceType !== 'All services' && filters.serviceType !== 'All') queryParams.append('serviceType', filters.serviceType);

      const response = await authenticatedFetch(`/api/campaigns/my_campaigns?${queryParams.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch my campaigns: ${response.status} ${response.statusText}`;
        console.error("API Error:", errorText);
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      let campaignsData: ICampaign[] = [];
      let paginationData = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      if (responseData.data && Array.isArray(responseData.data)) {
        campaignsData = responseData.data;
        if (responseData.pagination) {
          paginationData = responseData.pagination;
        }
      } else if (Array.isArray(responseData)) {
        campaignsData = responseData;
      }

      set({
        campaigns: campaignsData,
        pagination: paginationData,
        isLoading: false
      });
      return { success: true, data: campaignsData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching my campaigns:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage, data: [] };
    }
  },

  fetchAssignedCampaigns: async (page = 1, limit = 10, filters?: { status?: string; serviceType?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.serviceType && filters.serviceType !== 'All services') queryParams.append('serviceType', filters.serviceType);

      const response = await authenticatedFetch(`/api/campaigns/assigned_campaigns?${queryParams.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch assigned campaigns: ${response.status} ${response.statusText}`;
        console.error("API Error:", errorText);
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      let campaignsData: ICampaign[] = [];
      let paginationData = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      if (responseData.data && Array.isArray(responseData.data)) {
        campaignsData = responseData.data;
        if (responseData.pagination) {
          paginationData = responseData.pagination;
        }
      } else if (Array.isArray(responseData)) {
        campaignsData = responseData;
      }

      set({
        campaigns: campaignsData,
        pagination: paginationData,
        isLoading: false
      });
      return { success: true, data: campaignsData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching assigned campaigns:", err);
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

  filterCampaigns: async (filters: Record<string, string>) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "All") {
          queryParams.append(key, value);
        }
      });

      const response = await authenticatedFetch(
        `/api/campaigns?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to filter campaign: ${response.status} ${response.statusText}`;
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
      console.error("Error filtering campaign:", err);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

export const fetchCampaigns = (page?: number, limit?: number) =>
  useCampaignStore.getState().fetchCampaigns(page, limit);
export const fetchMyCampaigns = (page?: number, limit?: number, filters?: { status?: string; serviceType?: string }) =>
  useCampaignStore.getState().fetchMyCampaigns(page, limit, filters);
export const fetchAssignedCampaigns = (page?: number, limit?: number, filters?: { status?: string; serviceType?: string }) =>
  useCampaignStore.getState().fetchAssignedCampaigns(page, limit, filters);
export const fetchCampaignById = (id: string) =>
  useCampaignStore.getState().fetchCampaignById(id);
