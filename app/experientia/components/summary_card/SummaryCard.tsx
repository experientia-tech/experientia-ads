import React from 'react';
import styles from './SummaryCard.module.scss';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  icon,
  color = '#4f46e5' 
}) => {
  return (
    <div className={styles.summaryCard} style={{ '--accent-color': color } as React.CSSProperties}>
      <div className={styles.iconContainer} style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <div className={styles.content}>
        <h3 className={styles.value}>{value}</h3>
        <p className={styles.title}>{title}</p>
      </div>
    </div>
  );
};

export default SummaryCard;