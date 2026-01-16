'use client';

import { FiMapPin, FiClock, FiUser, FiFlag, FiNavigation, FiMap } from 'react-icons/fi';
import styles from './TaskDetail.module.scss';

interface TaskDetailProps {
  task: {
    id: string;
    executorName: string;
    completedOn: string;
    isFlagged: boolean;
    distance: string;
    timeFromPrevious: string;
    inGeofence: boolean;
    location: string;
  };
  onClose: () => void;
}

const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
  return (
    <div className={styles.taskDetailContainer}>
      <div className={styles.mapContainer}>
        {/* Map will be rendered here */}
        <div className={styles.mapPlaceholder}>
          <FiMap size={48} />
          <p>Map View</p>
        </div>
      </div>
      
      <div className={styles.taskInfo}>
        <div className={styles.taskHeader}>
          <h2>Task Details</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.taskMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Task ID</span>
            <span className={styles.metaValue}>{task.id}</span>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Executor</span>
            <div className={styles.executorInfo}>
              <FiUser className={styles.icon} />
              <span>{task.executorName}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Completed On</span>
            <div className={styles.timeInfo}>
              <FiClock className={styles.icon} />
              <span>{task.completedOn}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Location</span>
            <div className={styles.locationInfo}>
              <FiMapPin className={styles.icon} />
              <span>{task.location}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Distance from Previous</span>
            <div className={styles.distanceInfo}>
              <FiNavigation className={styles.icon} />
              <span>{task.distance}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Time from Previous</span>
            <span className={styles.metaValue}>{task.timeFromPrevious}</span>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Geo-fencing Zone</span>
            <span className={`${styles.statusBadge} ${task.inGeofence ? styles.inGeofence : styles.outOfGeofence}`}>
              {task.inGeofence ? 'Inside Geofence' : 'Outside Geofence'}
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button className={`${styles.flagButton} ${task.isFlagged ? styles.flagged : ''}`}>
            <FiFlag className={styles.icon} />
            {task.isFlagged ? 'Unflag Task' : 'Flag Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;