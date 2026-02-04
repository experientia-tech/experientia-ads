"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../constants/auth";
import CampaignCard from "../components/campaign_card/CampaignCard";
import Filters from "../components/filters/Filters";
import styles from "./page.module.scss";
import { ICampaign } from "../../constants/interface";
import {
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFlag,
  FiGrid,
  FiInbox,
  FiRefreshCw,
} from "react-icons/fi";
import SummaryCard from "../components/summary_card/SummaryCard";
import { useCampaignStore } from "../../store/Campaigns";

const DashboardPage = () => {
  const router = useRouter();
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
    }
  }, [router]);

  const { campaigns, fetchCampaigns } = useCampaignStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Calculate summary metrics
  const campaignsList = Array.isArray(campaigns) ? campaigns : [];
  const totalCampaigns = campaignsList.length;
  const activeCampaigns = campaignsList.filter(
    (campaign: ICampaign) =>
      campaign.status === "ACTIVE" || campaign.status === "active",
  ).length;

  const totalTasks = campaignsList.reduce(
    (sum: number, campaign: ICampaign) =>
      sum + (Number(campaign.totalTasks) || 0),
    0,
  );

  const completedTasks = campaignsList.reduce(
    (sum: number, campaign: ICampaign) =>
      sum + (Number(campaign.completedTasks) || 0),
    0,
  );

  const actualTaskCount = campaignsList.reduce(
    (sum: number, campaign: ICampaign) =>
      sum + (Array.isArray(campaign.tasks) ? campaign.tasks.length : 0),
    0,
  );

  const pendingTasks = Math.max(0, totalTasks - actualTaskCount);
  const flaggedTasks = campaignsList.reduce(
    (sum: number, campaign: ICampaign) =>
      sum + (Number(campaign.flaggedTasks) || 0),
    0,
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p className={styles.subtitle}>Overview of your campaigns and tasks</p>
      </div>
      <div className={styles.summaryGrid}>
        <SummaryCard
          title="Total Campaigns"
          value={totalCampaigns}
          icon={<FiLayers size={20} />}
          color="#4f46e5"
        />
        <SummaryCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={<FiGrid size={20} />}
          color="#8b5cf6"
        />
        <SummaryCard
          title="Total Tasks"
          value={totalTasks}
          icon={<FiCheckCircle size={20} />}
          color="#10b981"
        />
        <SummaryCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={<FiClock size={20} />}
          color="#f59e0b"
        />
        <SummaryCard
          title="Flagged Tasks"
          value={flaggedTasks}
          icon={<FiFlag size={20} />}
          color="#ef4444"
        />
      </div>

      <Filters />

      <div className="campaignsList">
        {campaigns.length > 0 ? (
          <div className={styles.campaignsGrid}>
            {campaigns.map((campaign: ICampaign) => (
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
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FiInbox size={48} />
            <h3>No Campaigns Found</h3>
            <p>You haven't been assigned to any campaigns yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
