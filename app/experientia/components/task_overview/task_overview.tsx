"use client";
import styles from "./taskOverview.module.scss";

interface TaskOverviewProps {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  progress: number;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
  totalTasks,
  completedTasks,
  remainingTasks,
  progress,
}) => {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className={styles.taskOverview}>
      <div className={styles.overviewHeader}>
        <div>
          <h2>Task Overview</h2>
          <p className={styles.overviewSub}>Campaign execution progress</p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressPct}>{pct.toFixed(0)}%</span>
          <span className={styles.progressLabel}>Complete</span>
        </div>
      </div>

      <div className={styles.progressBarWrap}>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={styles.progressMeta}>
          <span>{completedTasks} of {totalTasks} tasks done</span>
          <span>{remainingTasks} remaining</span>
        </div>
      </div>

      <div className={styles.taskStats}>
        <div className={`${styles.statItem} ${styles.statTotal}`}>
          <div className={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 12h6M9 16h6M9 8h6"/>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{totalTasks}</span>
            <span className={styles.statLabel}>Total Tasks</span>
          </div>
        </div>

        <div className={`${styles.statItem} ${styles.statCompleted}`}>
          <div className={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{completedTasks}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>

        <div className={`${styles.statItem} ${styles.statRemaining}`}>
          <div className={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{remainingTasks}</span>
            <span className={styles.statLabel}>Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;
