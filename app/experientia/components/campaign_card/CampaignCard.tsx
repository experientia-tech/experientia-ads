import React from 'react';
import Image from 'next/image';
import { FiChevronRight, FiCheckCircle, FiClock } from 'react-icons/fi';
import styles from './CampaignCard.module.scss';
import Link from 'next/link';

interface CampaignCardProps {
  campaign: {
    id: number;
    name: string;
    serviceType: string;
    role: string;
    startDate: string;
    endDate: string;
    totalTasks: number;
    completedTasks: number;
  };
  brandLogo: string;
  brandName: string;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, brandLogo, brandName }) => {
  const progressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <Link href={`/experientia/campaigns/${campaign.id}`} className={styles.campaignCardLink}>
    <div className={styles.campaignCard}>
      <div className={styles.campaignHeader}>
        <div className={styles.campaignLogo}>
          <Image 
            src={brandLogo} 
            alt={brandName} 
            width={40} 
            height={40} 
            className={styles.logo}
          />
        </div>
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
          <span className={styles.label}>Role</span>
          <span className={styles.value}>{campaign.role}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Start Date</span>
          <span className={styles.value}>{campaign.startDate}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>End Date</span>
          <span className={styles.value}>{campaign.endDate}</span>
        </div>
      </div>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <span>Task Progress</span>
          <span>{campaign.completedTasks} of {campaign.totalTasks} completed</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercentage(campaign.completedTasks, campaign.totalTasks)}%` }}
          ></div>
        </div>
        <div className={styles.progressStatus}>
          <span className={styles.statusItem}>
            <FiCheckCircle className={`${styles.icon} ${styles.completed}`} />
            {campaign.completedTasks} Completed
          </span>
          <span className={styles.statusItem}>
            <FiClock className={`${styles.icon} ${styles.pending}`} />
            {campaign.totalTasks - campaign.completedTasks} Pending
          </span>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default CampaignCard;