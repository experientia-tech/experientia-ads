'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiUserPlus, FiCheck } from 'react-icons/fi';
import styles from './SupervisorModal.module.scss';

interface Supervisor {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supervisor: Supervisor) => void;
  existingSupervisors?: string[];
}

const SupervisorModal: React.FC<SupervisorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  existingSupervisors = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);

  // Mock data - replace with actual API call
  const allSupervisors: Supervisor[] = [
    { id: '1', name: 'John Doe', role: 'Supervisor', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', role: 'Supervisor', email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', role: 'Supervisor', email: 'mike@example.com' },
  ];

  const filteredSupervisors = allSupervisors.filter(
    (supervisor) =>
      !existingSupervisors.includes(supervisor.id) &&
      (supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Supervisor</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
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
          {filteredSupervisors.length > 0 ? (
            filteredSupervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                className={`${styles.supervisorItem} ${
                  selectedSupervisor?.id === supervisor.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedSupervisor(supervisor)}
              >
                <div className={styles.supervisorInfo}>
                  <div className={styles.supervisorName}>{supervisor.name}</div>
                  <div className={styles.supervisorEmail}>{supervisor.email}</div>
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

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedSupervisor) {
                onSelect(selectedSupervisor);
                onClose();
              }
            }}
            className={`${styles.addButton} ${
              !selectedSupervisor ? styles.disabled : ''
            }`}
            disabled={!selectedSupervisor}
          >
            <FiUserPlus size={16} />
            Add Supervisor
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorModal;
