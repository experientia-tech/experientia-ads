'use client';

import { FiChevronDown, FiFilter } from 'react-icons/fi';
import styles from './Filters.module.scss';

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersProps {
  className?: string;
}

const Filters = ({ className = '' }: FiltersProps) => {
  // Mock data - replace with your actual data
  const types: FilterOption[] = [
    { value: 'all', label: 'All Types' },
    { value: 'social', label: 'Social Media' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'content', label: 'Content Creation' },
    { value: 'seo', label: 'SEO' },
  ];

  const services: FilterOption[] = [
    { value: 'all', label: 'All Services' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
  ];

  const locations: FilterOption[] = [
    { value: 'all', label: 'All Locations' },
    { value: 'new-york', label: 'New York' },
    { value: 'london', label: 'London' },
    { value: 'tokyo', label: 'Tokyo' },
    { value: 'sydney', label: 'Sydney' },
  ];

  const companies: FilterOption[] = [
    { value: 'all', label: 'All Companies' },
    { value: 'company-1', label: 'Company A' },
    { value: 'company-2', label: 'Company B' },
    { value: 'company-3', label: 'Company C' },
  ];

  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      <div className={styles.filtersHeader}>
        <FiFilter className={styles.filterIcon} />
        <h3 className={styles.filtersTitle}>Filters</h3>
      </div>
      
      <div className={styles.filterGrid}>
        <div className={styles.filterGroup}>
          <label htmlFor="type-filter" className={styles.filterLabel}>
            Type
          </label>
          <div className={styles.selectWrapper}>
            <select id="type-filter" className={styles.filterSelect}>
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <FiChevronDown className={styles.selectIcon} />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="service-filter" className={styles.filterLabel}>
            Service
          </label>
          <div className={styles.selectWrapper}>
            <select id="service-filter" className={styles.filterSelect}>
              {services.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
            <FiChevronDown className={styles.selectIcon} />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="location-filter" className={styles.filterLabel}>
            Location
          </label>
          <div className={styles.selectWrapper}>
            <select id="location-filter" className={styles.filterSelect}>
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <FiChevronDown className={styles.selectIcon} />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="company-filter" className={styles.filterLabel}>
            Company
          </label>
          <div className={styles.selectWrapper}>
            <select id="company-filter" className={styles.filterSelect}>
              {companies.map((company) => (
                <option key={company.value} value={company.value}>
                  {company.label}
                </option>
              ))}
            </select>
            <FiChevronDown className={styles.selectIcon} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;