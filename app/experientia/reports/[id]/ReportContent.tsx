'use client';

import { useState } from 'react';
import { FiDownload, FiMail, FiChevronLeft, FiSearch, FiFilter, FiCalendar, FiMapPin, FiFlag, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Link from 'next/link';
import TaskOverview from '@/app/experientia/components/task_overview/task_overview';
import styles from './page.module.scss';
import ReportCard from '@/app/experientia/components/report_card/Report_card';

const ReportContent = ({ campaignId, campaign }: { campaignId: string; campaign: any }) => {
  const [filters, setFilters] = useState({
    card: false,
    location: false,
    flagged: false,
    searchQuery: '',
    dateRange: { start: '', end: '' },
    executor: '',
    stateBackground: '',
    geofenced: false
  });

  const executors = [
    { id: 'all', name: 'All Executors' },
    { id: 'exec1', name: 'John Doe' },
    { id: 'exec2', name: 'Jane Smith' },
    { id: 'exec3', name: 'Mike Johnson' },
  ];

  const states = [
    { id: 'all', name: 'All States' },
    { id: 'completed', name: 'Completed' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'not_started', name: 'Not Started' },
  ];

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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
            <img
              src={campaign.logo}
              alt={campaign.name}
              className={styles.logo}
            />
          </div>
          <div className={styles.brandText}>
            <h2 className={styles.companyName}>{campaign.name}</h2>
            <div className={styles.serviceBadge}>
              {campaign.serviceType}
            </div>
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

        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}><FiFilter size={16} /> Filter by:</span>
            <button 
              className={`${styles.filterButton} ${filters.card ? styles.active : ''}`}
              onClick={() => handleFilterChange('card', !filters.card)}
            >
              Card
            </button>
            <button 
              className={`${styles.filterButton} ${filters.location ? styles.active : ''}`}
              onClick={() => handleFilterChange('location', !filters.location)}
            >
              <FiMapPin size={16} /> Location
            </button>
            <button 
              className={`${styles.filterButton} ${filters.flagged ? styles.active : ''}`}
              onClick={() => handleFilterChange('flagged', !filters.flagged)}
            >
              <FiFlag size={16} /> Flagged
            </button>
          </div>

          <div className={styles.searchGroup}>
            <div className={styles.searchBar}>
              <FiSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search by Task ID"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.dateRange}>
              <FiCalendar className={styles.inputIcon} />
              <input 
                type="date" 
                className={styles.dateInput}
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              />
              <span>to</span>
              <input 
                type="date" 
                className={styles.dateInput}
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              />
            </div>

            <select 
              className={styles.selectInput}
              value={filters.executor}
              onChange={(e) => handleFilterChange('executor', e.target.value)}
            >
              {executors.map(executor => (
                <option key={executor.id} value={executor.id}>
                  {executor.name}
                </option>
              ))}
            </select>

            <select 
              className={styles.selectInput}
              value={filters.stateBackground}
              onChange={(e) => handleFilterChange('stateBackground', e.target.value)}
            >
              {states.map(state => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <div className={styles.geofenceToggle}>
              <span>Geofenced Only</span>
              <button 
                className={styles.toggleButton}
                onClick={() => handleFilterChange('geofenced', !filters.geofenced)}
              >
                {filters.geofenced ? <FiToggleRight size={24} color="#4CAF50" /> : <FiToggleLeft size={24} color="#ccc" />}
              </button>
            </div>
          </div>
        </div>
      </div>
<div className={styles.reportGrid}>
  <ReportCard
    productName="Product Name"
    productImage="/path/to/product-image.jpg"
    taskId="TASK-12345"
    date="Oct 25, 2023"
    time="14:30"
    location="123 Main St, New York, NY"
    inGeofence={true}
    distance="28m"
    timeLater="36s"
    executorName="John Doe"
  />
  <ReportCard
    productName="Product Name"
    productImage="/path/to/product-image.jpg"
    taskId="TASK-12345"
    date="Oct 25, 2023"
    time="14:30"
    location="123 Main St, New York, NY"
    inGeofence={true}
    distance="28m"
    timeLater="36s"
    executorName="John Doe"
  />
  <ReportCard
    productName="Product Name"
    productImage="/path/to/product-image.jpg"
    taskId="TASK-12345"
    date="Oct 25, 2023"
    time="14:30"
    location="123 Main St, New York, NY"
    inGeofence={true}
    distance="28m"
    timeLater="36s"
    executorName="John Doe"
  />
  {/* Add more cards as needed */}
</div>
    </div>
  );
};

export default ReportContent;