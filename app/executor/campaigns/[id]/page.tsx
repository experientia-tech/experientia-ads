"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronLeft,
  FiMoreHorizontal,
  FiMap,
  FiClock,
} from "react-icons/fi";
import "./campaign-details.scss";

const CampaignDetails = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tasks" | "completed">("tasks");

  const tasks = [
    {
      id: "NYC-5021",
      status: "Pending",
      address: "5th Ave & 42nd St",
      type: "Digital",
      size: "14x48",
    },
    {
      id: "NYC-5022",
      status: "Pending",
      address: "Broadway & W 34th St",
      type: "Static",
      size: "10x30",
    },
    {
      id: "NYC-5025",
      status: "In Progress",
      address: "7th Ave & W 48th St",
      type: "Digital",
      size: "14x48",
      active: true,
    },
    {
      id: "NYC-5030",
      status: "Pending",
      address: "Lexington Ave & E 52nd St",
      type: "Static",
      size: "12x24",
    },
  ];

  return (
    <div className="campaign-details-page">
      <header className="details-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <FiChevronLeft size={24} />
        </button>
        <h1 className="header-title">Campaign Details</h1>
        <button className="menu-btn">
          <FiMoreHorizontal size={24} />
        </button>
      </header>

      <div className="campaign-banner">
        <div className="client-logo">
          <span className="logo-placeholder">✔️</span>
        </div>
        <div className="banner-info">
          <p className="client-name">NIKE INC.</p>
          <h2 className="campaign-name">Nike Air Max Launch</h2>
          <div className="meta-row">
            <span className="meta-item">
              <FiClock size={14} /> Due Oct 24
            </span>
            <span className="meta-item">
              <FiMap size={14} /> 16 Locs
            </span>
          </div>
        </div>
      </div>

      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          Your Tasks (12)
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed (4)
        </button>
      </div>

      <section className="task-list-section">
        <h3 className="section-title">Tasks List</h3>
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card design-card ${
                task.active ? "active-border" : ""
              }`}
            >
              <div className="task-card-content">
                <div className="task-icon">
                  <FiMap size={24} />
                </div>
                <div className="task-info">
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    <span
                      className={`status-badge ${task.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="task-address">{task.address}</p>
                  <p className="task-meta">
                    Billboard Type: {task.type} • {task.size}
                  </p>
                </div>
                <button
                  className={`action-btn ${
                    task.status === "In Progress" ? "resume" : "start"
                  }`}
                  onClick={() =>
                    router.push(`/executor/tasks/${task.id}/capture`)
                  }
                >
                  {task.status === "In Progress" ? "Resume" : "Start"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CampaignDetails;
