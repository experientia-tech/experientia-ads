"use client";
import React from "react";
import MobileHeader from "../components/mobile-header";
import CampaignCard from "../components/campaign-card";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import "./dashboard.scss";

const ExecutorDashboard = () => {
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
          <CampaignCard
            id="1"
            name="Coca-Cola Summer 24"
            location="123 Main St, Downtown"
            status="Pending"
            dueText="Due Today, 5:00 PM"
            icon="🥤"
          />
          <CampaignCard
            id="2"
            name="Nike Air Launch"
            location="450 Broadway, Soho"
            status="In Progress"
            dueText="Due Tomorrow"
            icon="📢"
          />
          <CampaignCard
            id="3"
            name="Spotify Wrapped"
            location="88 5th Ave, Flatiron"
            status="Scheduled"
            dueText="Oct 28"
            icon="🎵"
          />
        </div>
      </div>
    </div>
  );
};

export default ExecutorDashboard;
