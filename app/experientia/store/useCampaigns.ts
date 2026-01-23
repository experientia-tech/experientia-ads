import { useState, useEffect } from 'react';
import { Campaign } from '../../constants/interface';
import { authenticatedFetch } from './Auth';


export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      console.log('Fetching campaigns from API...');
      const response = await authenticatedFetch('/api/campaigns');
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      // Check if data is an array or needs to be extracted from a property
      const campaignsData = Array.isArray(data) ? data : (data.campaigns || data.data || []);
      console.log('Processed campaigns:', campaignsData);
      
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading, error, refresh: fetchCampaigns };
}
