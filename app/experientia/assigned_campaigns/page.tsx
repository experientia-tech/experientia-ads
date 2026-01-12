'use client';
import React, { useState } from 'react';
import BrandCard from '../../components/brand_card/BrandCard';
import CampaignCard from '../../components/campaign_card/CampaignCard';
import './page.scss';

// Mock data - replace with actual data from your API
const brandData = {
  logo: '/experentia.png',
  name: 'Experientia',
  totalCampaigns: 5,
  activeCampaigns: 3,
};

const campaigns = [
  {
    id: 1,
    name: 'Summer Sale 2023',
    serviceType: 'Social Media Marketing',
    role: 'Content Creator',
    startDate: '2023-06-01',
    endDate: '2023-08-31',
    totalTasks: 15,
    completedTasks: 8,
  },
  {
    id: 2,
    name: 'Product Launch',
    serviceType: 'Influencer Marketing',
    role: 'Campaign Manager',
    startDate: '2023-07-15',
    endDate: '2023-09-30',
    totalTasks: 10,
    completedTasks: 3,
  },
];

const AssignedCampaignsPage = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

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
            <option>Company 1</option>
            <option>Company 2</option>
            <option>Company 3</option>
          </select>
        </div>
      </div>

      <BrandCard 
        brandData={brandData}
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
      />

      <div className={`campaigns-list ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {campaigns.map((campaign) => (
          <CampaignCard 
            key={campaign.id}
            campaign={campaign}
            brandLogo={brandData.logo}
            brandName={brandData.name}
          />
        ))}
      </div>
    </div>
  );
};

export default AssignedCampaignsPage;
