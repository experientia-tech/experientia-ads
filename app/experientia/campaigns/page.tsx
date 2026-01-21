'use client';
import React, { useState } from 'react';
import BrandCard from '../components/brand_card/BrandCard';
import CampaignCard from '../components/campaign_card/CampaignCard';
import './page.scss';

// Mock data - replace with actual data from your API
const brandsData = [
  {
    id: 1,
    logo: '/experentia.png',
    name: 'Experientia',
    totalCampaigns: 5,
    activeCampaigns: 3,
    campaigns: [
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
    ]
  },
  {
    id: 2,
    logo: '/experentia.png',
    name: 'Nike',
    totalCampaigns: 3,
    activeCampaigns: 2,
    campaigns: [
      {
        id: 3,
        name: 'Just Do It Campaign',
        serviceType: 'Brand Awareness',
        role: 'Content Creator',
        startDate: '2023-08-01',
        endDate: '2023-10-31',
        totalTasks: 12,
        completedTasks: 5,
      },
      {
        id: 4,
        name: 'Air Max Launch',
        serviceType: 'Product Launch',
        role: 'Social Media Manager',
        startDate: '2023-09-01',
        endDate: '2023-11-30',
        totalTasks: 8,
        completedTasks: 2,
      }
    ]
  }
];

const AssignedCampaignsPage = () => {
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  const toggleBrandExpand = (brandId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBrandId(expandedBrandId === brandId ? null : brandId);
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
            {brandsData.map(brand => (
              <option key={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="brands-container">
        {brandsData.map((brand) => (
          <div key={brand.id} className="brand-campaign-container">
            <BrandCard 
              brandData={{
                logo: brand.logo,
                name: brand.name,
                totalCampaigns: brand.totalCampaigns,
                activeCampaigns: brand.activeCampaigns,
              }}
              isExpanded={expandedBrandId === brand.id}
              onToggleExpand={(e) => toggleBrandExpand(brand.id, e)}
            />
            
            <div className={`campaigns-list ${expandedBrandId === brand.id ? 'expanded' : 'collapsed'}`}>
              {brand.campaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id}
                  campaign={campaign}
                  brandLogo={brand.logo}
                  brandName={brand.name}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedCampaignsPage;
