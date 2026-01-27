"use client";
import React from "react";
import Link from "next/link";
import { FiMapPin, FiChevronRight } from "react-icons/fi";
import "./campaign-card.scss";

interface CampaignCardProps {
  id: string;
  name: string;
  location: string;
  status: "Pending" | "In Progress" | "Scheduled" | "Completed";
  dueText: string;
  startText: string;
  icon?: string;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  id,
  name,
  location,
  status,
  dueText,
  startText,
  icon,
}) => {
  return (
    <div className="campaign-card design-card">
      <div className="card-top">
        <div className="icon-box">
          {/* Mock icons or provided emoji/char for now to match screenshots */}
          <span className="mock-icon">{icon || "🥤"}</span>
        </div>
        <div className="content">
          <div className="title-row">
            <h3 className="name">{name}</h3>
            <span
              className={`status-badge ${status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {status}
            </span>
          </div>
          <div className="location-row">
            <FiMapPin size={14} />
            <span>{location}</span>
          </div>
        </div>
      </div>

      <div className="card-bottom">
        <span className="due-text">{startText}</span>
        <span className="due-text">{dueText}</span>
        <Link href={`/executor/campaigns/${id}`} className="details-link">
          Details <FiChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default CampaignCard;
