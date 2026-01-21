'use client';
import React, { useEffect } from 'react';
import CampaignCard from '../components/campaign_card/CampaignCard';
import { useCampaign } from '../context/CampaignContext';
import './page.scss';


const AssignedCampaignsPage = () => {
  const { state, fetchCampaigns } = useCampaign();
  const { campaigns, isLoading, error } = state;

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (isLoading && campaigns.length === 0) {
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
              key={`${campaign.id}-${campaign.name}`}
              campaign={campaign}
            />
          ))
        ) : (
          <div className="no-campaigns">
            <p>No campaigns found. You haven't been assigned to any campaigns yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedCampaignsPage;
