'use client';
import Image from 'next/image';
import TaskOverview from '../../components/task_overview/task_overview';
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
import TeamMemberTable from '../../components/team_member_table/TeamMemberTable';
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
       <button 
  onClick={() => window.history.back()}
  className={styles.backButton}
>
  <FiArrowLeft size={20} />
  <span>Back to Campaigns</span>
</button>
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
            <Link 
             href={`/experientia/reports/${campaign.id}`} 
            className={styles.reportButton}
            >
             <FiFileText size={16} />
                <span>View Full Report</span>
            </Link>
        </div>
      </div>
<TaskOverview 
  totalTasks={12}
  completedTasks={8}
  remainingTasks={4}
  progress={67}
  flaggedTasks={2}
/>

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
<div className={styles.teamMemberSection}>
  <TeamMemberTable members={[
    {
      id: '1',
      name: 'John Doe',
      contactNumber: '+1 (555) 123-4567',
      role: 'Manager',
      location: 'New York, USA',
      assignedBy: 'Admin',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      contactNumber: '+1 (555) 987-6543',
      role: 'Supervisor',
      location: 'Los Angeles, USA',
      assignedBy: 'John Doe',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      contactNumber: '+1 (555) 456-7890',
      role: 'Executor',
      location: 'Chicago, USA',
      assignedBy: 'Jane Smith',
      status: 'pending'
    }
  ]} />
</div>
</div>
</div>
  );
};

export default CampaignDetailsPage;