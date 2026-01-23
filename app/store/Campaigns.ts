import { ICampaign } from "../constants/interface";
import { authenticatedFetch } from "./Auth";

interface FetchCampaignsResponse {
  success: boolean;
  data?: ICampaign[];
  error?: string;
}

/**
 * Fetch all campaigns from the API
 * This is a normal function ready to execute, not a client-side React hook
 */
export const fetchCampaigns = async (): Promise<FetchCampaignsResponse> => {
  try {
    console.log("Fetching campaigns from API...");
    const response = await authenticatedFetch("/api/campaigns");
    console.log("API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return {
        success: false,
        error: `Failed to fetch campaigns: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log("API Response data:", data);

    // Check if data is an array or needs to be extracted from a property
    const campaignsData = Array.isArray(data)
      ? data
      : data.campaigns || data.data || [];
    console.log("Processed campaigns:", campaignsData);

    return {
      success: true,
      data: campaignsData,
    };
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An error occurred",
      data: [],
    };
  }
};

/**
 * Fetch a specific campaign by ID
 * @param campaignId - The ID of the campaign to fetch
 */
export const fetchCampaignById = async (
  campaignId: string,
): Promise<{
  success: boolean;
  data?: ICampaign;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`/api/campaigns/${campaignId}`);

    if (!response.ok) {
      const errorText = await response.text();

      return {
        success: false,
        error: `Failed to fetch campaign: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error("Error fetching campaign:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An error occurred",
    };
  }
};
