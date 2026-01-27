"use client";
import React from "react";
import MobileHeader from "../components/mobile-header";
import CampaignCard from "../components/campaign-card";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import "./dashboard.scss";
import { useExecutorStore } from "@/app/store/Executor";
import { useEffect } from "react";

const ExecutorDashboard = () => {
  const { getCampaigns, campaigns, isLoading } = useExecutorStore();

  useEffect(() => {
    getCampaigns();
  }, []);

  return (
    <div className="dashboard-page">
      <MobileHeader title="Hello, Alex" subtitle="Monday, Oct 24 • New York" />

      <div className="stats-section">
        <div className="stat-card design-card">
          <div className="icon-box green">
            <FiCheckCircle size={24} />
          </div>
          <div className="data">
            <h2 className="value">12</h2>
            <p className="label">Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card design-card">
          <div className="icon-box blue">
            <FiClock size={24} />
          </div>
          <div className="data">
            <h2 className="value">4</h2>
            <p className="label">Active Tasks</p>
          </div>
        </div>
      </div>

      <div className="list-section">
        <div className="section-header">
          <h2 className="section-title">Your Campaigns</h2>
          <button className="see-all">See All</button>
        </div>

        <div className="campaign-list">
          {isLoading ? (
            <p>Loading campaigns...</p>
          ) : campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id?.toString() || ""}
                name={campaign.name || "Untitled Campaign"}
                location={campaign.address || "No location specified"}
                status={
                  (campaign.status as
                    | "Pending"
                    | "In Progress"
                    | "Scheduled"
                    | "Completed") || "Pending"
                }
                dueText={
                  campaign.endDate
                    ? `Ends ${new Date(campaign.endDate).toLocaleDateString()}`
                    : "No end date"
                }
                startText={
                  campaign.startDate
                    ? `Starts ${new Date(campaign.startDate).toLocaleDateString()}`
                    : "No start date"
                }
                icon={campaign.serviceType === "Beverage" ? "🥤" : "📢"}
              />
            ))
          ) : (
            <p>No campaigns found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutorDashboard;
