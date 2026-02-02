'use client';
import styles from './taskOverview.module.scss';

interface TaskOverviewProps {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  progress: number;
  flaggedTasks: number;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
  totalTasks,
  completedTasks,
  remainingTasks,
  progress,
  flaggedTasks,
}) => {
  return (
    <div className={styles.taskOverview}>
      <h2>Task Overview</h2>
      <div className={styles.taskStats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalTasks}</span>
          <span className={styles.statLabel}>Total Tasks</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{completedTasks}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{remainingTasks}</span>
          <span className={styles.statLabel}>Remaining</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.progressCircle} style={{ 
            background: `conic-gradient(#4a90e2 0% ${progress}%, #e9ecef ${progress}% 100%)`
          }}>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <span className={styles.statLabel}>Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{flaggedTasks}</span>
          <span className={styles.statLabel}>Flagged</span>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;