"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiChevronLeft,
  FiMoreHorizontal,
  FiMap,
  FiClock,
} from "react-icons/fi";
import "./campaign-details.scss";
import { useExecutorStore } from "@/app/store/Executor";
import { getExecutorToken } from "@/app/store/Executor";
import { CampaignTaskResponse } from "@/types/campaign";
import ErrorModal from "@/app/experientia/components/error_modal/ErrorModal";

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  address?: string;
  organizationId?: string;
}

interface Task {
  id: string;
  status: string;
  address: string;
  type: string;
  size: string;
  active?: boolean;
}

const CampaignDetails = () => {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const { getCampaigns } = useExecutorStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tasks, setTasks] = useState<CampaignTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchCampaignTasks();
    }
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      const token = getExecutorToken();
      if (!token) {
        router.push("/executor/login");
        return;
      }

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("We couldn't load this campaign. Please try again.");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setCampaign(data.data);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't load this campaign. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignTasks = async () => {
    try {
      const token = getExecutorToken();
      if (!token) return;

      const response = await fetch(
        `/api/executor/campaigns/${campaignId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("We couldn't load your tasks. Please try again.");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't load your tasks. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <div className="campaign-details-page">
        <header className="details-header">
          <button className="back-btn" onClick={() => window.history.back()}>
            <FiChevronLeft size={24} />
          </button>
          <h1 className="header-title">Campaign Details</h1>
          <button className="menu-btn"></button>
        </header>
        <div className="page-loading-state">
          <div className="page-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-details-page">
      <header className="details-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <FiChevronLeft size={24} />
        </button>
        <h1 className="header-title">Campaign Details</h1>
        <button className="menu-btn">
          {/* <FiMoreHorizontal size={24} /> */}
        </button>
      </header>

      <div className="campaign-banner">
        <div className="client-logo">
          <span className="logo-placeholder">📢</span>
        </div>
        <div className="banner-info">
          <p className="client-name">{campaign?.serviceType || "CAMPAIGN"}</p>
          <h2 className="campaign-name">{campaign?.name || "Loading..."}</h2>
          <div className="meta-row">
            <span className="meta-item">
              <FiClock size={14} />{" "}
              {campaign?.endDate
                ? `Ends ${new Date(campaign.endDate).toLocaleDateString()}`
                : "No end date"}
            </span>
          </div>
        </div>
      </div>

      <div className="task-cta-section">
        <div className="cta-content">
          <h3 className="cta-title">Complete a task</h3>
          <p className="cta-description">
            Start working on your assigned
            <br className="mobile-break" /> tasks to earn rewards
          </p>
        </div>
        <button
          className="add-task-btn"
          onClick={() => {
            // Store campaign ID in sessionStorage for capture page
            sessionStorage.setItem("currentCampaignId", campaignId);
            router.push("/executor/tasks/capture");
          }}
        >
          <span>+</span>
        </button>
      </div>

      <div className="tasks-header">
        <h3 className="section-title">Your Tasks ({tasks.length})</h3>
      </div>

      <section className="task-list-section">
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card design-card ${
                task.status ? "active-border" : ""
              }`}
              // onClick={() => {
              //   // Store campaign ID and task data for details page
              //   sessionStorage.setItem("currentCampaignId", campaignId);
              //   sessionStorage.setItem("selectedTask", JSON.stringify(task));
              //   router.push(
              //     `/executor/campaigns/${campaignId}/tasks/${task.id}`,
              //   );
              // }}
              style={{ cursor: "pointer" }}
            >
              <div className="task-card-content">
                <div className="task-icon">
                  <FiMap size={24} />
                </div>
                <div className="task-info">
                  <div className="task-header">
                    <span className="task-id">
                      {task.metadata.location.address}
                    </span>
                  </div>
                  {/* <p className="task-address">{task.address}</p> */}
                  <p className="task-meta">
                    Location: {task.metadata.location.latitude} •{" "}
                    {task.metadata.location.longitude}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ErrorModal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Something went wrong"
        message={errorMessage || ""}
        buttonText="Dismiss"
      />
    </div>
  );
};

export default CampaignDetails;
