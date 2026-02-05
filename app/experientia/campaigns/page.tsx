"use client";
import React, { useState, useEffect, useCallback } from "react";
import { authenticatedFetch } from "../../constants/api";
import CampaignCard from "../components/campaign_card/CampaignCard";
import "./page.scss";

interface Campaign {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  serviceType?: string;
  description?: string;
  organizationId?: string;
  address?: string;
  totalTasks?: number;
  completedTasks?: number;
  members?: any[];
  tasks?: Array<{ status: string }>;
  createdAt?: string;
  updatedAt?: string;
}

const AssignedCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch("/api/campaigns");
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }
      const responseData = await response.json();
      let campaignsData: Campaign[] = [];
      if (Array.isArray(responseData)) {
        campaignsData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data.data)) {
        campaignsData = responseData.data.data;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        campaignsData = responseData.data;
      } else if (responseData.campaigns) {
        campaignsData = responseData.campaigns;
      }

      setCampaigns(campaignsData);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();

    // Listen for campaign creation events
    const handleCampaignCreated = () => {
      console.log("Campaign created event received, refreshing campaigns...");
      fetchCampaigns();
    };

    // Add event listener for custom campaign creation event
    window.addEventListener("campaignCreated", handleCampaignCreated);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("campaignCreated", handleCampaignCreated);
    };
  }, [fetchCampaigns]);

  if (loading) {
    return (
      <div className="assigned-campaigns">
        <div className="header">
          <h1>Assigned Campaigns</h1>
          <p className="subheading">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assigned-campaigns">
        <div className="header">
          <h1>Assigned Campaigns</h1>
          <p className="subheading error">Error loading campaigns: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-campaigns">
      <div className="header">
        <h1>Assigned Campaigns</h1>
        <p className="subheading">Campaigns assigned to you</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <select className="filter-select">
            <option>All services</option>
            <option>Social Media</option>
            <option>Influencer Marketing</option>
            <option>Email Campaigns</option>
          </select>
        </div>

        <div className="filter-group">
          <select className="filter-select">
            <option>All locations</option>
            <option>United States</option>
            <option>Europe</option>
            <option>Asia</option>
          </select>
        </div>

        <div className="filter-group">
          <select className="filter-select">
            <option>All companies</option>
          </select>
        </div>
      </div>

      <div className="campaigns-list">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={{
                ...campaign,
                serviceType: campaign.serviceType || "General",
                description: campaign.description || "",
                organizationId: campaign.organizationId || "",
                address: campaign.address || "",
                totalTasks: campaign.totalTasks || 0,
                completedTasks: campaign.completedTasks || 0,
                members: campaign.members || [],
                tasks: campaign.tasks || [],
                createdAt: campaign.createdAt || new Date().toISOString(),
                updatedAt: campaign.updatedAt || new Date().toISOString(),
              }}
            />
          ))
        ) : (
          <div className="no-campaigns">
            <p>
              No campaigns found. You haven't been assigned to any campaigns
              yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedCampaignsPage;
