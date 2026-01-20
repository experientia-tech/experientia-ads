/**
 * Example: How to use authenticatedFetch in your components
 *
 * This file demonstrates various patterns for making authenticated API calls
 */

import { authenticatedFetch } from "../store/Auth";

// Example 1: Fetch user profile
export const fetchUserProfile = async () => {
  try {
    const response = await authenticatedFetch("/api/user/profile", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Example 2: Fetch campaigns
export const fetchCampaigns = async () => {
  try {
    const response = await authenticatedFetch("/api/campaigns", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch campaigns");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Example 3: Create a new campaign
export const createCampaign = async (campaignData: any) => {
  try {
    const response = await authenticatedFetch("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(campaignData),
    });

    if (!response.ok) {
      throw new Error("Failed to create campaign");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Example 4: Update campaign
export const updateCampaign = async (campaignId: string, updates: any) => {
  try {
    const response = await authenticatedFetch(`/api/campaigns/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update campaign");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Example 5: Delete campaign
export const deleteCampaign = async (campaignId: string) => {
  try {
    const response = await authenticatedFetch(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete campaign");
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Example 6: Fetch campaign members
export const fetchCampaignMembers = async (campaignId: string) => {
  try {
    const response = await authenticatedFetch(
      `/api/campaign-members?campaignId=${campaignId}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch campaign members");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Usage in a React component:
 *
 * import { fetchCampaigns } from '@/app/experientia/utils/apiExamples';
 *
 * const MyComponent = () => {
 *   const [campaigns, setCampaigns] = useState([]);
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState('');
 *
 *   useEffect(() => {
 *     const loadCampaigns = async () => {
 *       setLoading(true);
 *       const result = await fetchCampaigns();
 *       setLoading(false);
 *
 *       if (result.success) {
 *         setCampaigns(result.data);
 *       } else {
 *         setError(result.error);
 *       }
 *     };
 *
 *     loadCampaigns();
 *   }, []);
 *
 *   return (
 *     <div>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error}</p>}
 *       {campaigns.map(campaign => (
 *         <div key={campaign.id}>{campaign.name}</div>
 *       ))}
 *     </div>
 *   );
 * };
 */
