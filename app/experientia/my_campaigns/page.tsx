"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../constants/auth";
import { authenticatedFetch } from "../../constants/api";
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
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
    }
  }, [router]);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const response = await authenticatedFetch('/api/dashboard/summary');
        const data = await response.json();
        if (data.success) {
          setSummaryData(data.data);
        } else {
          console.error('Failed to fetch summary:', data.message);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const { campaigns, fetchMyCampaigns, pagination, isLoading } = useCampaignStore();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const loaderRef = React.useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({ status: '', serviceType: '' });
  const lastFetchedParams = React.useRef<string>("");

  useEffect(() => {
    const paramsKey = JSON.stringify({ page: currentPage, limit, filters });
    if (lastFetchedParams.current === paramsKey) return;

    lastFetchedParams.current = paramsKey;
    fetchMyCampaigns(currentPage, limit, filters);
  }, [fetchMyCampaigns, currentPage, filters]);

  const handleFilterChange = useCallback((newFilters: { status: string; serviceType: string }) => {
    setFilters((prev) => {
      if (prev.status === newFilters.status && prev.serviceType === newFilters.serviceType) {
        return prev;
      }
      return newFilters;
    });
    if (filters.status !== newFilters.status || filters.serviceType !== newFilters.serviceType) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.serviceType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoading && currentPage < pagination.totalPages) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [isLoading, currentPage, pagination.totalPages]);

  // Use summary data instead of calculating from campaigns
  const totalCampaigns = summaryData?.totalCampaigns || 0;
  const totalTasks = summaryData?.totalTasks || 0;
  const completedTasks = summaryData?.completedTasks || 0;
  const pendingTasks = summaryData?.pendingTasks || 0;
  const flaggedTasks = summaryData?.flaggedTasks || 0;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>My Campaigns</h1>
        <p className={styles.subtitle}>All campaigns in your organization</p>
      </div>
      <div className={styles.summaryGrid}>
        <SummaryCard
          title="Total Campaigns"
          value={totalCampaigns}
          icon={<FiLayers size={20} />}
          color="#4f46e5"
        />
        <SummaryCard
          title="Total Tasks"
          value={totalTasks}
          icon={<FiCheckCircle size={20} />}
          color="#10b981"
        />
        <SummaryCard
          title="Completed Tasks"
          value={completedTasks}
          icon={<FiCheckCircle size={20} />}
          color="#10b981"
        />
        <SummaryCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={<FiClock size={20} />}
          color="#f59e0b"
        />
        {/* <SummaryCard
          title="Flagged Tasks"
          value={flaggedTasks}
          icon={<FiFlag size={20} />}
          color="#ef4444"
        /> */}
      </div>

      <Filters onFilterChange={handleFilterChange} />

      <div className="campaignsList">
        {campaigns.length > 0 ? (
          <>
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

            {/* Infinite Scroll Loader */}
            <div ref={loaderRef} style={{ height: '20px', margin: '20px 0', textAlign: 'center' }}>
              {isLoading && <p>Loading more...</p>}
            </div>
          </>
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
