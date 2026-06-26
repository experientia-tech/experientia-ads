"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FiMapPin, FiClock, FiUser, FiFlag, FiNavigation, FiMap, FiX, FiChevronLeft, FiChevronRight, FiCheck, FiTrash2, FiPlus, FiLoader } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import styles from './TaskDetail.module.scss';
import { uploadFileToS3 } from '@/app/constants/upload';

// Dynamically import map component from executor to avoid SSR issues
const MapComponent = dynamic(() => import('../../../executor/tasks/location/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <p>Loading map...</p>
    </div>
  ),
});

interface TaskDetailProps {
  task: {
    id: string;
    executorName: string;
    executorId: string;
    completedOn: string;
    isFlagged: boolean;
    distance: string;
    timeFromPrevious: string;
    inGeofence: boolean;
    location: string;
    latitude?: number;
    longitude?: number;
    metadata?: any;
    status: string;
    rejectionReason?: string;
    notes?: string | null;
  };
  onClose: () => void;
  onStatusUpdate?: () => void;
}

const TaskDetail = ({ task, onClose, onStatusUpdate }: TaskDetailProps) => {
  const [images, setImages] = useState<any[]>(task.metadata?.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(task.metadata?.images || []);
    setCurrentImageIndex(0);
  }, [task.id]);

  const handleUpdateStatus = async (newStatus: "ACCEPTED" | "REJECTED") => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const body: any = { status: newStatus };
      if (newStatus === "REJECTED") {
        body.rejectionReason = rejectionReason;
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update task status");
      }

      if (onStatusUpdate) {
        onStatusUpdate();
      }
      onClose();
    } catch (err: any) {
      alert(err.message || "Something went wrong while updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePhoto = async (indexToDelete: number) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    const newImages = images.filter((_, index) => index !== indexToDelete);
    setIsUpdatingImages(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ images: newImages }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete photo");
      }

      setImages(newImages);
      setCurrentImageIndex((prev) => 
        prev >= newImages.length ? Math.max(0, newImages.length - 1) : prev
      );

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err: any) {
      alert(err.message || "Error deleting photo");
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setIsUpdatingImages(true);
    try {
      const uploadedUrl = await uploadFileToS3(file);
      const newImages = [...images, { url: uploadedUrl }];

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ images: newImages }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add photo");
      }

      setImages(newImages);
      setCurrentImageIndex(newImages.length - 1);

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err: any) {
      alert(err.message || "Error adding photo");
    } finally {
      setIsUploadingImage(false);
      setIsUpdatingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const currentImage = images[currentImageIndex];
  const progressPercentage = images.length > 0 ? ((currentImageIndex + 1) / images.length) * 100 : 0;
  
  return (
    <div className={styles.taskDetailContainer}>
      <div className={styles.mapContainer}>
        {images.length > 0 ? (
          <div className={styles.imageGallery}>
            <div className={styles.imageContainer}>
              <img 
                src={currentImage?.url || currentImage} 
                alt={`Task image ${currentImageIndex + 1}`}
                className={styles.taskImage}
              />
              <button 
                className={styles.deletePhotoBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(currentImageIndex);
                }}
                disabled={isUpdatingImages}
                title="Delete this photo"
                type="button"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
            
            <div className={styles.imageNavigation}>
              <button 
                className={styles.navButton}
                onClick={handlePreviousImage}
                disabled={images.length <= 1}
                title="Previous image"
              >
                <FiChevronLeft size={20} />
              </button>
              
              <span className={styles.imageCounter}>
                {currentImageIndex + 1}/{images.length}
              </span>
              
              <button 
                className={styles.navButton}
                onClick={handleNextImage}
                disabled={images.length <= 1}
                title="Next image"
              >
                <FiChevronRight size={20} />
              </button>
            </div>

            <div className={styles.galleryActions}>
              <button 
                className={styles.addPhotoBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingImages}
                type="button"
              >
                {isUploadingImage ? <FiLoader className={styles.spinnerIcon} size={16} /> : <FiPlus size={16} />}
                <span>Add Photo</span>
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleUploadPhoto}
              />
            </div>
            
            <div className={styles.imageScrollbar}>
              <div 
                className={styles.scrollbarProgress}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.mapPlaceholder}>
            <FiMap size={48} />
            <p>No images available</p>
            <div className={styles.galleryActions} style={{ marginTop: '12px' }}>
              <button 
                className={styles.addPhotoBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingImages}
                type="button"
              >
                {isUploadingImage ? <FiLoader className={styles.spinnerIcon} size={16} /> : <FiPlus size={16} />}
                <span>Add Photo</span>
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleUploadPhoto}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.taskInfo}>
        <div className={styles.taskHeader}>
          <h2>Task Details</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.taskMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Task ID</span>
            <span className={styles.metaValue}>{task.id}</span>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Executor</span>
            <div className={styles.executorInfo}>
              <FiUser className={styles.icon} />
              <span>{task.executorName}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Status</span>
            <span className={`${styles.statusBadge} ${task.status?.toUpperCase() === "PENDING" ? styles.pending : styles.accepted}`}>
              {task.status?.toUpperCase() === "PENDING" ? "PENDING" : "CREATED"}
            </span>
          </div>

          {task.status === "REJECTED" && task.rejectionReason && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Rejection Reason</span>
              <div className={styles.rejectionReasonText}>{task.rejectionReason}</div>
            </div>
          )}

          {task.notes && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Description</span>
              <div className={styles.descriptionText}>{task.notes}</div>
            </div>
          )}

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Submitted On</span>
            <div className={styles.timeInfo}>
              <FiClock className={styles.icon} />
              <span>{task.completedOn}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Location</span>
            <div className={styles.locationInfo}>
              <FiMapPin className={styles.icon} />
              <span>{task.location}</span>
            </div>
          </div>
          
          {task.latitude && task.longitude && (
            <>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Coordinates</span>
                <div className={styles.coordinatesInfo}>
                  <div className={styles.coordItem}>
                    <span className={styles.coordLabel}>Latitude:</span>
                    <span className={styles.coordValue}>{task.latitude.toFixed(6)}</span>
                  </div>
                  <div className={styles.coordItem}>
                    <span className={styles.coordLabel}>Longitude:</span>
                    <span className={styles.coordValue}>{task.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Map View</span>
                <div className={styles.mapWrapper}>
                  <MapComponent 
                    lat={task.latitude}
                    lng={task.longitude}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Distance from Previous</span>
            <div className={styles.distanceInfo}>
              <FiNavigation className={styles.icon} />
              <span>{task.distance}</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Time from Previous</span>
            <span className={styles.metaValue}>{task.timeFromPrevious}</span>
          </div>
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Geo-fencing Zone</span>
            <span className={`${styles.statusBadge} ${task.inGeofence ? styles.inGeofence : styles.outOfGeofence}`}>
              {task.inGeofence ? 'Inside Geofence' : 'Outside Geofence'}
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;