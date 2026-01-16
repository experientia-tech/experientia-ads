'use client';
import Image from 'next/image';
import { FiDownload, FiMail, FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';
import TaskOverview from '../../components/task_overview/task_overview';
import styles from './page.module.scss';
import { useParams } from 'next/navigation';

const ReportPage = async ({ params }: { params: { id: string } }) => {
  const campaignId = await Promise.resolve(params.id);
  
  // Mock data - replace with actual data fetching
  const campaign = {
    id: campaignId,
    name: 'Summer Sale 2023',
    serviceType: 'Social Media Marketing',
    logo: '/experentia.png',
  };

  return (
    <div className={styles.reportPage}>
      <div className={styles.header}>
        <Link href={`/experientia/campaigns/${campaignId}`} className={styles.backButton}>
          <FiChevronLeft size={20} />
          <span>Back to Campaign</span>
        </Link>
      </div>

      <div className={styles.reportHeader}>
        <div className={styles.brandInfo}>
          <div className={styles.logoContainer}>
            <Image
              src={campaign.logo}
              alt={campaign.name}
              width={80}
              height={80}
              className={styles.logo}
            />
          </div>
          <div className={styles.serviceBadge}>
            {campaign.serviceType}
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportButton}>
            <FiDownload size={16} />
            <span>Export to Excel</span>
          </button>
          <button className={styles.emailButton}>
            <FiMail size={16} />
            <span>Email Report</span>
          </button>
        </div>
      </div>

      <div className={styles.reportContent}>
        <TaskOverview 
          totalTasks={12}
          completedTasks={8}
          remainingTasks={4}
          progress={67}
          flaggedTasks={2}
        />
      </div>
    </div>
  );
};

export default ReportPage;