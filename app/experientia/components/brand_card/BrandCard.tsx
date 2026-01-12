// In BrandCard.tsx
import React from 'react';
import Image from 'next/image';
import { FiChevronDown } from 'react-icons/fi';
import styles from './BrandCard.module.scss';

interface BrandCardProps {
  brandData: {
    logo: string;
    name: string;
    totalCampaigns: number;
    activeCampaigns: number;
  };
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ 
  brandData, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <div className={styles.brandSummary}>
      <div className={styles.brandInfo}>
        <div className={styles.brandLogo}>
          <Image 
            src={brandData.logo} 
            alt={brandData.name} 
            width={48} 
            height={48} 
            className={styles.logo}
          />
        </div>
        <div className={styles.brandDetails}>
          <h3>{brandData.name}</h3>
          <div className={styles.campaignStats}>
            <span>{brandData.totalCampaigns} Campaigns</span>
            <span className={styles.divider}>•</span>
            <span className={styles.active}>{brandData.activeCampaigns} Active</span>
          </div>
        </div>
      </div>
      <button 
        className={`${styles.expandBtn} ${isExpanded ? styles.expanded : ''}`}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse campaigns' : 'Expand campaigns'}
      >
        <FiChevronDown size={20} />
      </button>
    </div>
  );
};

export default BrandCard;