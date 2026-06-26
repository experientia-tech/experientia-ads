"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FiMapPin, FiCheck, FiX, FiCalendar, FiUser } from "react-icons/fi";
import styles from "./Report_card.module.scss";

// Dynamically import MapComponent to prevent SSR issues
const MapComponent = dynamic(
  () => import("@/app/executor/tasks/location/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.mapLoading}>
        <span>Loading map...</span>
      </div>
    ),
  },
);

interface ReportCardProps {
  productName: string;
  productImage: string;
  taskId: string;
  date: string;
  time: string;
  location: string;
  inGeofence: boolean;
  distance: string;
  timeLater: string;
  executorName: string;
  status?: string;
  onClick?: () => void;
  latitude?: number;
  longitude?: number;
  forceShowMap?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  productName,
  productImage,
  taskId,
  date,
  time,
  location,
  inGeofence,
  distance,
  timeLater,
  executorName,
  status = "PENDING",
  onClick,
  latitude,
  longitude,
  forceShowMap = false,
}) => {
  const [showMapLocal, setShowMapLocal] = useState(false);
  const showMap = forceShowMap || showMapLocal;
  const hasCoordinates =
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null;
  const addressParts = location.split(",");
  const cityHeader =
    addressParts.length >= 3
      ? addressParts.slice(-3).join(",").trim()
      : location;

  return (
    <div className={styles.reportCard} onClick={onClick}>
      <div
        className={`${styles.productImageContainer} ${showMap && hasCoordinates ? styles.withMap : ""}`}
      >
        <img
          src={productImage}
          alt={productName}
          className={styles.productImage}
        />

        {showMap && hasCoordinates ? (
          <div
            className={styles.gpsHudOverlay}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.hudMapContainer}>
              <MapComponent lat={latitude} lng={longitude} />
            </div>
            <div className={styles.hudInfo}>
              <div className={styles.hudLocationTitle}>{cityHeader}</div>
              <div className={styles.hudAddressText}>{location}</div>
              <div className={styles.hudMetaText}>
                Lat {latitude.toFixed(6)}° Long {longitude.toFixed(6)}°
              </div>
              <div className={styles.hudMetaText}>
                {date} at {time}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.productName}>{productName}</div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoSection}>
          <div className={styles.infoRow}>
            <FiCalendar className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Task ID: {taskId}</span>
              <span className={styles.infoValue}>
                {date} at {time}
              </span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <FiUser className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Executor</span>
              <span className={styles.infoValue}>{executorName}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <FiMapPin className={styles.icon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Location</span>
              <div className={styles.locationInfo}>
                <span className={styles.locationText}>{location}</span>
                <div className={styles.locationMeta}>
                  <span
                    className={`${styles.statusBadge} ${inGeofence ? styles.success : styles.error}`}
                  >
                    {inGeofence ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>
                      {inGeofence ? "In Geo-fence" : "Out of Geo-fence"}
                    </span>
                  </span>
                  <span className={styles.metaItem}>{distance} away</span>
                  <span className={styles.metaDivider}>•</span>
                  <span className={styles.metaItem}>{timeLater} later</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
