'use client';
import { useState, useEffect } from 'react';
import { FiSearch, FiX, FiUserPlus, FiCheck, FiAlertCircle, FiPlus } from 'react-icons/fi';
import styles from './ExecutorModal.module.scss';
import { authenticatedFetch } from '../../../constants/api';
import AddExecutorModal from './AddExecutorModal';

export interface Executor {
  id: string;
  name: string;
  role: string;
  phone?: string;
}

interface ExecutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (executor: Executor) => Promise<void> | void;
  existingExecutors?: string[];
  campaignId: string;
  isLoading?: boolean;
  organizationId: string;
  onAddSuccess?: () => void;
}

const ExecutorModal: React.FC<ExecutorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  existingExecutors = [],
  campaignId,
  isLoading = false,
  organizationId,
  onAddSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddExecutorModalOpen, setIsAddExecutorModalOpen] = useState(false);

  useEffect(() => {
    const fetchExecutors = async () => {
      try {
        setIsLoadingState(true);
        const response = await authenticatedFetch('/api/executors');

        if (!response.ok) {
          throw new Error('Failed to fetch executors');
        }

        const responseData = await response.json();
        const executorsData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];

        const formattedExecutors = executorsData.map((user: any) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName || ''}`.trim() || 'Unnamed Executor',
          role: user.role || 'EXECUTOR',
          phone: user.phone || ''
        }));

        setExecutors(formattedExecutors);
      } catch (err) {
        console.error('Error fetching executors:', err);
        setError('Failed to load executors. Please try again.');
      } finally {
        setIsLoadingState(false);
      }
    };

    if (isOpen) {
      fetchExecutors();
    }
  }, [isOpen]);

  const handleAddExecutorSuccess = (newExecutor: any) => {
    // Refresh the executor list
    fetchExecutors();
    setIsAddExecutorModalOpen(false);
    // Trigger success callback if provided
    if (onAddSuccess) {
      onAddSuccess();
    }
    // Close the main ExecutorModal since the executor is now automatically added to the campaign
    onClose();
  };

  const fetchExecutors = async () => {
    try {
      setIsLoadingState(true);
      const response = await authenticatedFetch('/api/executors');

      if (!response.ok) {
        throw new Error('Failed to fetch executors');
      }

      const responseData = await response.json();
      const executorsData = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      const formattedExecutors = executorsData.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName || ''}`.trim() || 'Unnamed Executor',
        role: user.role || 'EXECUTOR',
        phone: user.phone || ''
      }));

      setExecutors(formattedExecutors);
    } catch (err) {
      console.error('Error fetching executors:', err);
      setError('Failed to load executors. Please try again.');
    } finally {
      setIsLoadingState(false);
    }
  };

  const filteredExecutors = executors.filter(
    (executor) =>
      !existingExecutors?.includes(executor.id) &&
      executor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Executor</h3>
          <div className={styles.headerActions}>
            <button
              onClick={() => setIsAddExecutorModalOpen(true)}
              className={styles.addNewButton}
              title="Add new executor"
            >
              <FiPlus size={16} />
              <span>Add New</span>
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search executors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.supervisorList}>
          {isLoadingState ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading executors...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <FiAlertCircle size={24} />
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          ) : filteredExecutors.length > 0 ? (
            filteredExecutors.map((executor) => (
              <div
                key={executor.id}
                className={`${styles.supervisorItem} ${selectedExecutor?.id === executor.id ? styles.selected : ''
                  }`}
                onClick={() => setSelectedExecutor(executor)}
              >
                <div className={styles.supervisorInfo}>
                  <div className={styles.supervisorName}>{executor.name}</div>
                </div>
                {selectedExecutor?.id === executor.id && (
                  <FiCheck className={styles.checkIcon} />
                )}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              {searchTerm ? 'No matching executors found' : 'No executors available'}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={isLoadingState}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.addButton} ${!selectedExecutor ? styles.disabled : ''
              }`}
            onClick={() => selectedExecutor && onSelect(selectedExecutor)}
            disabled={!selectedExecutor || isLoadingState}
            type="button"
          >
            {isLoadingState ? 'Adding...' : 'Add Executor'}
          </button>
        </div>
      </div>

      <AddExecutorModal
        isOpen={isAddExecutorModalOpen}
        onClose={() => setIsAddExecutorModalOpen(false)}
        onSuccess={handleAddExecutorSuccess}
        organizationId={organizationId}
        campaignId={campaignId}
      />
    </div>
  );
};

export default ExecutorModal;
