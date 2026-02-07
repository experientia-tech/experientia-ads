import { useState, useEffect } from "react";
import { FiChevronDown, FiFilter } from "react-icons/fi";
import styles from "./Filters.module.scss";


interface FilterOption {
  value: string;
  label: string;
}

interface FiltersProps {
  className?: string;
  onFilterChange: (filters: { status: string; serviceType: string }) => void;
}

const Filters = ({ className = "", onFilterChange }: FiltersProps) => {
  const [status, setStatus] = useState("all");
  const [serviceType, setServiceType] = useState("All");

  const statuses: FilterOption[] = [
    { value: "all", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const services: FilterOption[] = [
    { value: "All", label: "All Services" },
    { value: "Auto Hood", label: "Auto Hood" },
    { value: "No Parking Boards", label: "No Parking Boards" },
    { value: "Pole Boards", label: "Pole Boards" },
    { value: "Shop Branding", label: "Shop Branding" },
  ];

  useEffect(() => {
    // Notify parent of filter changes instead of fetching directly
    onFilterChange({
      status: status === "all" ? "" : status,
      serviceType: serviceType === "All" ? "" : serviceType,
    });
  }, [status, serviceType, onFilterChange]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceType(e.target.value);
  };

  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      <div className={styles.filtersHeader}>
        <FiFilter className={styles.filterIcon} />
        <h3 className={styles.filtersTitle}>Filters</h3>
      </div>

      <div className={styles.filterGrid}>
        <div className={styles.filterGroup}>
          <label htmlFor="status-filter" className={styles.filterLabel}>
            Status
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="status-filter"
              className={styles.filterSelect}
              value={status}
              onChange={handleStatusChange}
            >
              {statuses.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
            <select
              id="service-filter"
              className={styles.filterSelect}
              value={serviceType}
              onChange={handleServiceChange}
            >
              {services.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
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
