"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../store/Auth";
import BrandCard from "../components/brand_card/BrandCard";
import CampaignCard from "../components/campaign_card/CampaignCard";
import Filters from "../components/filters/Filters";
import styles from "./page.module.scss";
import {
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import SummaryCard from "../components/summary_card/SummaryCard";

const DashboardPage = () => {
  const router = useRouter();
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
    }
  }, [router]);

  // Mock data for brands
  const brands = [
    {
      id: 1,
      name: "Nike",
      logo: "/experentia.png",
      totalCampaigns: 3,
      activeCampaigns: 2,
      campaigns: [
        {
          id: 1,
          name: "Summer Collection",
          status: "active",
          serviceType: "Social Media Marketing",
          role: "Content Creator",
          startDate: "2024-06-01",
          endDate: "2024-08-31",
          totalTasks: 15,
          completedTasks: 8,
          flaggedTasks: 2,
        },
        {
          id: 2,
          name: "Back to School",
          status: "active",
          serviceType: "Email Marketing",
          role: "Content Creator",
          startDate: "2024-07-15",
          endDate: "2024-09-15",
          totalTasks: 10,
          completedTasks: 3,
          flaggedTasks: 1,
        },
        {
          id: 3,
          name: "Winter Sale",
          status: "paused",
          serviceType: "Social Media",
          role: "Photographer",
          startDate: "2024-11-01",
          endDate: "2024-12-31",
          totalTasks: 8,
          completedTasks: 0,
          flaggedTasks: 0,
        },
      ],
    },
    {
      id: 2,
      name: "Adidas",
      logo: "/experentia.png",
      totalCampaigns: 2,
      activeCampaigns: 1,
      campaigns: [
        {
          id: 4,
          name: "Ultraboost Launch",
          status: "active",
          serviceType: "Influencer Marketing",
          role: "Influencer",
          startDate: "2024-05-01",
          endDate: "2024-07-31",
          totalTasks: 20,
          completedTasks: 15,
          flaggedTasks: 0,
        },
        {
          id: 5,
          name: "Holiday Special",
          status: "completed",
          serviceType: "Social Media",
          role: "Content Creator",
          startDate: "2023-11-15",
          endDate: "2023-12-31",
          totalTasks: 12,
          completedTasks: 12,
          flaggedTasks: 0,
        },
      ],
    },
    {
      id: 3,
      name: "Puma",
      logo: "/experentia.png",
      totalCampaigns: 1,
      activeCampaigns: 0,
      campaigns: [
        {
          id: 6,
          name: "New Arrivals",
          status: "draft",
          serviceType: "Social Media",
          role: "Content Creator",
          startDate: "2024-09-01",
          endDate: "2024-10-31",
          totalTasks: 10,
          completedTasks: 0,
          flaggedTasks: 0,
        },
      ],
    },
  ];
  const totalCampaigns = brands.reduce(
    (sum, brand) => sum + brand.totalCampaigns,
    0,
  );
  const activeCampaigns = brands.reduce(
    (sum, brand) => sum + brand.activeCampaigns,
    0,
  );
  const totalTasks = brands.reduce(
    (sum, brand) =>
      sum +
      brand.campaigns.reduce(
        (taskSum, campaign) => taskSum + campaign.totalTasks,
        0,
      ),
    0,
  );
  const completedTasks = brands.reduce(
    (sum, brand) =>
      sum +
      brand.campaigns.reduce(
        (taskSum, campaign) => taskSum + campaign.completedTasks,
        0,
      ),
    0,
  );
  const pendingTasks = totalTasks - completedTasks;
  const flaggedTasks = brands.reduce(
    (sum, brand) =>
      sum +
      brand.campaigns.reduce(
        (taskSum, campaign) => taskSum + campaign.flaggedTasks,
        0,
      ),
    0,
  );

  const toggleBrandExpand = (brandId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBrandId(expandedBrandId === brandId ? null : brandId);
  };

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
          icon={<FiLayers />}
          color="#4f46e5"
        />
        <SummaryCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={<FiCheckCircle />}
          color="#10b981"
        />
        <SummaryCard
          title="Total Tasks"
          value={totalTasks}
          icon={<FiLayers />}
          color="#3b82f6"
        />
        <SummaryCard
          title="Completed Tasks"
          value={completedTasks}
          icon={<FiCheckCircle />}
          color="#10b981"
        />
        <SummaryCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={pendingTasks > 0 ? <FiAlertCircle /> : <FiCheckCircle />}
          color={pendingTasks > 0 ? "#f59e0b" : "#10b981"}
        />
        <SummaryCard
          title="Flagged Tasks"
          value={flaggedTasks}
          icon={<FiAlertCircle />}
          color="#ef4444"
        />
      </div>

      <Filters />

      <div className={styles.brandsSection}>
        {brands.map((brand) => (
          <div key={brand.id} className={styles.brandContainer}>
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
            <div
              className={`${styles.campaignsList} ${expandedBrandId === brand.id ? styles.expanded : styles.collapsed}`}
            >
              {brand.campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    serviceType: campaign.serviceType,
                    role: campaign.role,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    totalTasks: campaign.totalTasks,
                    completedTasks: campaign.completedTasks,
                  }}
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

export default DashboardPage;
