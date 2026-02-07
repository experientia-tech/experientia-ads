"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useCampaignStore, fetchAssignedCampaigns } from "../../store/Campaigns";
import CampaignCard from "../components/campaign_card/CampaignCard";
import "./page.scss";
import { ICampaign } from "../../constants/interface";


const AssignedCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string>('');
  const lastFetchedParams = React.useRef<string>("");

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchAssignedCampaigns(1, 10, { serviceType });
      if (!result.success) {
        throw new Error(result.error);
      }
      setCampaigns(result.data || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    const paramsKey = JSON.stringify({ serviceType });
    if (lastFetchedParams.current === paramsKey) return;

    lastFetchedParams.current = paramsKey;
    fetchCampaigns();

    const handleCampaignCreated = () => {
      console.log("Campaign created event received, refreshing campaigns...");
      lastFetchedParams.current = ""; // Force refresh
      fetchCampaigns();
    };

    window.addEventListener("campaignCreated", handleCampaignCreated);
    return () => {
      window.removeEventListener("campaignCreated", handleCampaignCreated);
    };
  }, [fetchCampaigns, serviceType]);

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
          <select
            className="filter-select"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="">All services</option>
            <option value="Auto Hood">Auto Hood</option>
            <option value="Pole Branding">Pole Branding</option>
            <option value="No Parking Boards">No Parking Boards</option>
            <option value="Shop Branding">Shop Branding</option>
          </select>
        </div>

        {/*   <div className="filter-group">
          <select className="filter-select">
            <option>All locations</option>
            <option>United States</option>
            <option>Europe</option>
            <option>Asia</option>
          </select>
        </div> */}

        {/*  <div className="filter-group">
          <select className="filter-select">
            <option>All companies</option>
          </select>
        </div> */}
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
