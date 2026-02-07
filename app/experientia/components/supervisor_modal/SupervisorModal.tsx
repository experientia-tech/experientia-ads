'use client';
import { useState, useEffect } from 'react';
import { FiSearch, FiX, FiUserPlus, FiCheck, FiAlertCircle, FiPlus } from 'react-icons/fi';
import styles from './SupervisorModal.module.scss';
import { authenticatedFetch } from '../../../constants/api';
import AddSupervisorModal from './AddSupervisorModal';

export interface Supervisor {
  id: string;
  name: string;
  role: string;
  phone?: string;
}

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supervisor: Supervisor) => Promise<void> | void;
  existingSupervisors?: string[];
  campaignId: string;
  isLoading?: boolean;
  organizationId: string;
  onAddSuccess?: () => void;
}

const SupervisorModal: React.FC<SupervisorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  existingSupervisors = [],
  campaignId,
  isLoading = false,
  organizationId,
  onAddSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddSupervisorModalOpen, setIsAddSupervisorModalOpen] = useState(false);

  const handleAddSupervisorSuccess = (newSupervisor: any) => {
    // Refresh supervisor list
    fetchSupervisors();
    setIsAddSupervisorModalOpen(false);
    // Trigger success callback if provided
    if (onAddSuccess) {
      onAddSuccess();
    }
    // Close main SupervisorModal since supervisor is now automatically added to campaign
    onClose();
  };

  const fetchSupervisors = async () => {
    try {
      setIsLoadingState(true);
      const response = await authenticatedFetch('/api/supervisors');

      if (!response.ok) {
        throw new Error('Failed to fetch supervisors');
      }

      const responseData = await response.json();
      const supervisorsData = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      const formattedSupervisors = supervisorsData.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName || ''}`.trim() || 'Unnamed Supervisor',
        role: user.role || 'SUPERVISOR',
        phone: user.phone || ''
      }));

      setSupervisors(formattedSupervisors);
    } catch (err) {
      console.error('Error fetching supervisors:', err);
      setError('Failed to load supervisors. Please try again.');
    } finally {
      setIsLoadingState(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSupervisors();
    }
  }, [isOpen]);

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      !existingSupervisors?.includes(supervisor.id) &&
      supervisor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Supervisor</h3>
          <div className={styles.headerActions}>
            <button
              onClick={() => setIsAddSupervisorModalOpen(true)}
              className={styles.addNewButton}
              title="Add new supervisor"
            >
              <FiPlus size={14} />
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
              placeholder="Search supervisors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.supervisorList}>
          {isLoadingState ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading supervisors...</p>
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
          ) : filteredSupervisors.length > 0 ? (
            filteredSupervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                className={`${styles.supervisorItem} ${selectedSupervisor?.id === supervisor.id ? styles.selected : ''
                  }`}
                onClick={() => setSelectedSupervisor(supervisor)}
              >
                <div className={styles.supervisorInfo}>
                  <div className={styles.supervisorName}>{supervisor.name}</div>
                </div>
                {selectedSupervisor?.id === supervisor.id && (
                  <FiCheck className={styles.checkIcon} />
                )}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              {searchTerm ? 'No matching supervisors found' : 'No supervisors available'}
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
            className={`${styles.button} ${styles.addButton} ${!selectedSupervisor ? styles.disabled : ''
              }`}
            onClick={() => selectedSupervisor && onSelect(selectedSupervisor)}
            disabled={!selectedSupervisor || isLoadingState}
            type="button"
          >
            {isLoadingState ? 'Adding...' : 'Add Supervisor'}
          </button>
        </div>
      </div>

      <AddSupervisorModal
        isOpen={isAddSupervisorModalOpen}
        onClose={() => setIsAddSupervisorModalOpen(false)}
        onSuccess={handleAddSupervisorSuccess}
        organizationId={organizationId}
        campaignId={campaignId}
      />
    </div>
  );
};

export default SupervisorModal;
