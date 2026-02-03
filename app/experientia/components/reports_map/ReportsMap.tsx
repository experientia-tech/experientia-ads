"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./ReportsMap.module.scss";

interface TaskLocation {
  id: string;
  lat: number;
  lng: number;
  status: string;
}

interface ReportsMapProps {
  tasks: TaskLocation[];
  totalTasks: number;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function ReportsMap({ tasks, totalTasks }: ReportsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  console.log(tasks, "The tasks");

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11", // Clean, light style
        center: tasks.length > 0 ? [tasks[0].lng, tasks[0].lat] : [0, 0],
        zoom: 12,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    tasks.forEach((task) => {
      if (typeof task.lat === "number" && typeof task.lng === "number") {
        const marker = new mapboxgl.Marker({
          color: "#EF4444", // Red markers as in the image
          scale: 0.6,
        })
          .setLngLat([task.lng, task.lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      }
    });

    // Fit map to markers if there are tasks
    if (tasks.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      tasks.forEach((task) => {
        if (typeof task.lat === "number" && typeof task.lng === "number") {
          bounds.extend([task.lng, task.lat]);
        }
      });
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    return () => {
      // Optional: Clean up markers on unmount
      // markersRef.current.forEach((marker) => marker.remove());
    };
  }, [tasks]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return <div className={styles.mapError}>Mapbox token not configured</div>;
  }

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapTitle}>
        Showing {tasks.length} Of {totalTasks} Tasks On Map
      </div>

      <div className={styles.mapContainer} ref={mapContainerRef} />

      <div className={styles.mapOverlay}>
        <div className={styles.statsCard}>
          <div className={styles.statsHeader}>
            <div className={styles.redPin} />
            <span className={styles.statsTitle}>
              {tasks.length} Tasks Completed
            </span>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.blue}`} />
              <span>Light Blue: &lt;100 Tasks</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.yellow}`} />
              <span>Yellow: 100-500 Tasks</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.red}`} />
              <span>Red: 1000+ Tasks (Dense!)</span>
            </div>
          </div>

          <div className={styles.zoomNotice}>
            💡 Zoom In Close (15+) To See Individual Tasks
          </div>
        </div>
      </div>
    </div>
  );
}
