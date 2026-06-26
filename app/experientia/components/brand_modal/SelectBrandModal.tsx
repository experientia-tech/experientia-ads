'use client';
import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import styles from './SelectBrandModal.module.scss';
import { authenticatedFetch } from '@/app/constants/api';

interface Brand {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

interface SelectBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  currentBrandId?: string;
  onSelectSuccess: () => void;
}

const SelectBrandModal: React.FC<SelectBrandModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  currentBrandId,
  onSelectSuccess
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(currentBrandId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBrands();
      setSelectedBrandId(currentBrandId || null);
    }
  }, [isOpen, currentBrandId]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch all brands (without pagination since it is a selection modal, or fetch first 50)
      const response = await authenticatedFetch('/api/brands?limit=50');
      if (!response.ok) throw new Error("Failed to fetch brands");
      const resData = await response.json();
      if (resData.success && resData.data) {
        setBrands(resData.data.brands || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await authenticatedFetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: selectedBrandId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to link brand");
      }

      onSelectSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to link brand");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Select Brand</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.brandList}>
          {error && (
            <div className={styles.errorState}>
              <FiAlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading brands...</p>
            </div>
          ) : filteredBrands.length > 0 ? (
            filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className={`${styles.brandItem} ${
                  selectedBrandId === brand.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedBrandId(selectedBrandId === brand.id ? null : brand.id)}
              >
                <div className={styles.brandInfo}>
                  {brand.image ? (
                    <img src={brand.image} alt={brand.name} className={styles.brandLogo} />
                  ) : (
                    <div className={styles.brandPlaceholder}>{brand.name[0]?.toUpperCase()}</div>
                  )}
                  <span className={styles.brandName}>{brand.name}</span>
                </div>
                {selectedBrandId === brand.id && <FiCheck className={styles.checkIcon} />}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>No brands found.</div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.saveButton}`}
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Linking...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectBrandModal;
