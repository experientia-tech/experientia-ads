'use client';
import React, { useEffect } from 'react';
import CampaignCard from '../components/campaign_card/CampaignCard';
import { useCampaign } from '../context/CampaignContext';
import './page.scss';

const transformCampaigns = (campaigns: any[]) => {
  const orgsMap = new Map();
  
  campaigns.forEach(campaign => {
    const orgId = campaign.organizationId;
    if (!orgsMap.has(orgId)) {
      orgsMap.set(orgId, {
        id: orgId,
        logo: '/experentia.png',
        name: campaign.organization?.name || 'Organization',
        campaigns: []
      });
    }
    
    orgsMap.get(orgId).campaigns.push({
      id: campaign.id,
      name: campaign.name,
      serviceType: campaign.serviceType || 'General',
      role: 'Campaign Member',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      totalTasks: campaign.tasks?.length || 0,
      completedTasks: campaign.tasks?.filter((t: any) => t.status === 'completed')?.length || 0,
    });
  });
  
  return Array.from(orgsMap.values()).map(org => ({
    ...org,
    totalCampaigns: org.campaigns.length,
    activeCampaigns: org.campaigns.filter((c: any) => {
      const endDate = new Date(c.endDate);
      const today = new Date();
      return endDate >= today;
    }).length
  }));
};

const AssignedCampaignsPage = () => {
  const { state, fetchCampaigns } = useCampaign();
  const { campaigns, isLoading, error } = state;

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const brandsData = transformCampaigns(campaigns);
  const allCampaigns = brandsData.flatMap(brand => 
    brand.campaigns.map(campaign => ({
      ...campaign,
      brandLogo: brand.logo,
      brandName: brand.name
    }))
  );

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
            {brandsData.map(brand => (
              <option key={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="campaigns-list">
        {allCampaigns.length > 0 ? (
          allCampaigns.map((campaign) => (
            <CampaignCard 
              key={`${campaign.id}-${campaign.brandName}`}
              campaign={campaign}
              brandLogo={campaign.brandLogo}
              brandName={campaign.brandName}
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
