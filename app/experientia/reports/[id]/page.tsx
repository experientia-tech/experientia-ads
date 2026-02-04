"use client";
import { fetchCampaignById } from "@/app/store/Campaigns";
import { ICampaign } from "@/app/constants/interface";
import { useState, useEffect, use } from "react";
import ReportContent from './ReportContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReportPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;

  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchCampaignById(campaignId);
        if (res.success) {
          setCampaign(res.data || null);
        } else {
          throw new Error(res.error || 'Failed to fetch campaign');
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return <ReportContent campaignId={campaignId} campaign={campaign} />;
}