import React from "react";
import Image from "next/image";
import { FiChevronRight, FiCheckCircle, FiClock } from "react-icons/fi";
import styles from "./CampaignCard.module.scss";
import Link from "next/link";
import { formatDate } from "@/app/constants/date";

export interface CampaignCardProps {
  campaign: {
    id: string | number;
    name: string;
    serviceType: string;
    description: string;
    organizationId: string;
    status: string;
    address: string;
    startDate: string;
    endDate: string;
    totalTasks: number;
    completedTasks?: number;
    members: any[];
    tasks: Array<{ status: string }>;
    createdAt: string;
    updatedAt: string;
    taskCount?: number;
  };
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const totalTasksFromApi = campaign.totalTasks || 0;
  // Completed tasks are those with ACCEPTED status
  const completedTasks = Array.isArray(campaign.tasks) && campaign.tasks.length > 0
    ? campaign.tasks.filter((t: any) => t.status === "ACCEPTED").length
    : (campaign.taskCount !== undefined ? campaign.taskCount : 0);

  const pendingTasks = totalTasksFromApi - completedTasks;

  const progressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <Link
      href={`/experientia/campaigns/${campaign.id}`}
      className={styles.campaignCardLink}
    >
      <div className={styles.campaignCard}>
        <div className={styles.campaignHeader}>
          <div className={styles.campaignInfo}>
            <h4>{campaign.name}</h4>
            <p className={styles.serviceType}>{campaign.serviceType}</p>
          </div>
          <button className={styles.expandCampaign}>
            <FiChevronRight size={20} />
          </button>
        </div>

        <div className={styles.campaignDetails}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Status</span>
            <span className={styles.value}>{campaign.status}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Start Date</span>
            <span className={styles.value}>
              {formatDate(campaign.startDate)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>End Date</span>
            <span className={styles.value}>{formatDate(campaign.endDate)}</span>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span>Task Progress</span>
            <span>
              {completedTasks} of {totalTasksFromApi} completed
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${progressPercentage(completedTasks, totalTasksFromApi)}%`,
              }}
            ></div>
          </div>
          <div className={styles.progressStatus}>
            <span className={styles.statusItem}>
              <FiCheckCircle className={`${styles.icon} ${styles.completed}`} />
              {completedTasks} Completed
            </span>
            <span className={styles.statusItem}>
              <FiClock className={`${styles.icon} ${styles.pending}`} />
              {pendingTasks} Pending
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CampaignCard;
