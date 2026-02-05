'use client';
import { useState } from 'react';
import { FiX, FiUserPlus, FiAlertCircle } from 'react-icons/fi';
import styles from './AddSupervisorModal.module.scss';
import { authenticatedFetch } from '../../../constants/api';

interface AddSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supervisor: any) => void;
  organizationId: string;
  campaignId: string;
}

const AddSupervisorModal: React.FC<AddSupervisorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  campaignId
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.location.trim()) {
      setError('All fields are required');
      return;
    }

    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          location: formData.location.trim(),
          organizationId,
          campaignId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create supervisor');
      }

      const newSupervisor = await response.json();
      onSuccess(newSupervisor.data || newSupervisor);
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        location: ''
      });
      
    } catch (err) {
      console.error('Error creating supervisor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create supervisor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        location: ''
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add New Supervisor</h3>
          <button onClick={handleClose} className={styles.closeButton} disabled={isLoading}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formFields}>
            <div className={styles.fieldGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter first name"
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter last name"
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter phone number"
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="location" className={styles.label}>
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter location"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorContainer}>
              <FiAlertCircle size={16} />
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiUserPlus size={16} />
                  Create Supervisor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupervisorModal;
