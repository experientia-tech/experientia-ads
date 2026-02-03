"use client";

import React, { useState } from 'react';
import { FiMapPin, FiClock, FiUser, FiFlag, FiNavigation, FiMap, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import styles from './TaskDetail.module.scss';

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
  };
  onClose: () => void;
}

const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
  const images = task.metadata?.images || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
            <span className={styles.metaLabel}>Completed On</span>
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
          <button className={`${styles.flagButton} ${task.isFlagged ? styles.flagged : ''}`}>
            <FiFlag className={styles.icon} />
            {task.isFlagged ? 'Unflag Task' : 'Flag Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;