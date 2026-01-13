'use client';

import { FiMapPin, FiClock, FiCheck, FiX, FiChevronRight, FiCalendar, FiUser } from 'react-icons/fi';
import styles from './Report_card.module.scss';

interface ReportCardProps {
  productName: string;
  productImage: string;
  taskId: string;
  date: string;
  time: string;
  location: string;
  inGeofence: boolean;
  distance: string;
  timeLater: string;
  executorName: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  productName,
  productImage,
  taskId,
  date,
  time,
  location,
  inGeofence,
  distance,
  timeLater,
  executorName,
}) => {
  return (
    <div className={styles.reportCard}>
      <div className={styles.productImageContainer}>
        <img 
          src={productImage} 
          alt={productName} 
          className={styles.productImage}
        />
        <div className={styles.productName}>{productName}</div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoSection}>
          <div className={styles.infoRow}>
            <FiCalendar className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Task ID: {taskId}</span>
              <span className={styles.infoValue}>{date} at {time}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <FiUser className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Executor</span>
              <span className={styles.infoValue}>{executorName}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <FiMapPin className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Location</span>
              <div className={styles.locationInfo}>
                <span className={styles.locationText}>{location}</span>
                <div className={styles.locationMeta}>
                  <span className={`${styles.statusBadge} ${inGeofence ? styles.success : styles.error}`}>
                    {inGeofence ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{inGeofence ? 'In Geo-fence' : 'Out of Geo-fence'}</span>
                  </span>
                  <span className={styles.metaItem}>{distance} away</span>
                  <span className={styles.metaDivider}>•</span>
                  <span className={styles.metaItem}>{timeLater} later</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;