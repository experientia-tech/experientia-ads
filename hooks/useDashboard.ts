import { useState, useEffect } from 'react';

export interface Campaign {
  id: string | number;
  name: string;
  status: string;
  serviceType: string;
  description: string;
  organizationId: string;
  address: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  flaggedTasks?: number;
  members: any[];
  tasks: Array<{ status: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalCampaigns: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  flaggedTasks: number;
  campaigns: Campaign[];
}

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard summary');
        }
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading, error };
}
