'use client';
import Image from 'next/image';
import { 
  FiEdit2, 
  FiFileText, 
  FiArrowLeft, 
  FiBriefcase, 
  FiUsers, 
  FiUserCheck, 
  FiUserPlus,
  FiPlus 
} from 'react-icons/fi';
import Link from 'next/link';
import styles from './page.module.scss';

const CampaignDetailsPage = ({ params }: { params: { id: string } }) => {
  // Mock data - replace with actual data fetching
  const campaign = {
    id: params.id,
    name: 'Summer Sale 2023',
    serviceType: 'Social Media Marketing',
    logo: '/experentia.png',
    startDate: '2023-06-01',
    endDate: '2023-08-31',
    status: 'Active',
    description: 'Summer promotional campaign for new product line launch',
  };

  return (
    <div className={styles.campaignDetailsPage}>
      <div className={styles.header}>
        <Link href="/experientia/assigned_campaigns" className={styles.backButton}>
          <FiArrowLeft size={20} />
          <span>Back to Campaigns</span>
        </Link>
      </div>

      <div className={styles.campaignHeader}>
        <div className={styles.campaignInfo}>
          <div className={styles.logoContainer}>
            <Image
              src={campaign.logo}
              alt={campaign.name}
              width={80}
              height={80}
              className={styles.logo}
            />
          </div>
          <div className={styles.campaignText}>
            <h1>{campaign.name}</h1>
            <div className={styles.serviceBadge}>
              {campaign.serviceType}
            </div>
            <p className={styles.description}>{campaign.description}</p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.editButton}>
            <FiEdit2 size={16} />
            <span>Edit Campaign</span>
          </button>
          <button className={styles.reportButton}>
            <FiFileText size={16} />
            <span>View Full Report</span>
          </button>
        </div>
      </div>
      <div className={styles.taskOverview}>
        <h2>Task Overview</h2>
        <div className={styles.taskStats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>12</span>
            <span className={styles.statLabel}>Total Tasks</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>8</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>4</span>
            <span className={styles.statLabel}>Remaining</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.progressCircle}>
              <span>67%</span>
            </div>
            <span className={styles.statLabel}>Progress</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>2</span>
            <span className={styles.statLabel}>Flagged</span>
          </div>
        </div>
      </div>

      <div className={styles.campaignInfoSection}>
        <h2>Campaign Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Role</span>
            <span className={styles.infoValue}>Campaign Manager</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Created</span>
            <span className={styles.infoValue}>May 15, 2023</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Started</span>
            <span className={styles.infoValue}>{campaign.startDate}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>End Date</span>
            <span className={styles.infoValue}>{campaign.endDate}</span>
          </div>
        </div>
      </div>
<div className={styles.teamOverview}>
  <h2>Team & Partners</h2>
  <div className={styles.teamGrid}>
    <div className={styles.teamCard}>
      <div className={styles.teamContent}>
        <div className={styles.teamIcon}>
          <FiBriefcase size={24} />
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamCount}>3</span>
          <span className={styles.teamLabel}>Brands</span>
        </div>
      </div>
      <button className={styles.addButton}>
        <FiPlus size={20} />
      </button>
    </div>

    <div className={styles.teamCard}>
      <div className={styles.teamContent}>
        <div className={styles.teamIcon}>
          <FiUsers size={24} />
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamCount}>2</span>
          <span className={styles.teamLabel}>Agencies</span>
        </div>
      </div>
      <button className={styles.addButton}>
        <FiPlus size={20} />
      </button>
    </div>

    <div className={styles.teamCard}>
      <div className={styles.teamContent}>
        <div className={styles.teamIcon}>
          <FiUserCheck size={24} />
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamCount}>5</span>
          <span className={styles.teamLabel}>Supervisors</span>
        </div>
      </div>
      <button className={styles.addButton}>
        <FiPlus size={20} />
      </button>
    </div>

    <div className={styles.teamCard}>
      <div className={styles.teamContent}>
        <div className={styles.teamIcon}>
          <FiUserPlus size={24} />
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamCount}>8</span>
          <span className={styles.teamLabel}>Executors</span>
        </div>
      </div>
      <button className={styles.addButton}>
        <FiPlus size={20} />
      </button>
    </div>
  </div>
</div>
</div>
  );
};

export default CampaignDetailsPage;