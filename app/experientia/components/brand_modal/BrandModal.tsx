'use client';
import { useState } from 'react';
import { FiX, FiAlertCircle, FiLoader, FiUpload } from 'react-icons/fi';
import styles from './BrandModal.module.scss';
import { authenticatedFetch } from '@/app/constants/api';
import { uploadFileToS3 } from '@/app/constants/upload';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const url = await uploadFileToS3(file);
      setImage(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image to S3");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Brand name is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await authenticatedFetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create brand");
      }

      onSuccess();
      setName('');
      setDescription('');
      setImage('');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save brand");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Brand</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.modalBody}>
          {error && (
            <div className={styles.errorBanner}>
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="brandName">Brand Name *</label>
            <input
              id="brandName"
              type="text"
              placeholder="e.g. Coca-Cola"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="brandDesc">Description</label>
            <textarea
              id="brandDesc"
              placeholder="Enter brand description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={4}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Brand Image (Logo)</label>
            <div className={styles.uploadContainer}>
              {image ? (
                <div className={styles.imagePreview}>
                  <img src={image} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className={styles.removeImgBtn}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={styles.uploadPlaceholder}>
                  {isUploading ? (
                    <>
                      <FiLoader className={styles.spin} size={20} />
                      <span>Uploading logo...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload size={20} />
                      <span>Upload Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploading || isSaving}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
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
              type="submit"
              className={`${styles.button} ${styles.saveButton}`}
              disabled={isSaving || isUploading || !name.trim()}
            >
              {isSaving ? 'Saving...' : 'Add Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandModal;
