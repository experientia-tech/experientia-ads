"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./ReportsMap.module.scss";

interface TaskLocation {
  id: string;
  latitude: number;
  longitude: number;
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center:
          tasks.length > 0
            ? [tasks[0].longitude, tasks[0].latitude]
            : [78.9629, 20.5937], // Default to India center if no tasks
        zoom: 12,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      mapRef.current.on("load", () => {
        setupClusters();
      });
    } else {
      updateSource();
    }

    function setupClusters() {
      if (!mapRef.current) return;

      const geojson: any = {
        type: "FeatureCollection",
        features: tasks
          .filter(
            (t) =>
              !isNaN(parseFloat(t.latitude.toString())) &&
              !isNaN(parseFloat(t.longitude.toString())),
          )
          .map((t) => ({
            type: "Feature",
            properties: { id: t.id, status: t.status },
            geometry: {
              type: "Point",
              coordinates: [
                parseFloat(t.longitude.toString()),
                parseFloat(t.latitude.toString()),
              ],
            },
          })),
      };

      mapRef.current.addSource("tasks", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster Layer
      mapRef.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "tasks",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#3B82F6", // Blue < 100
            100,
            "#FACC15", // Yellow 100-500
            500,
            "#22C55E", // Green > 500
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            500,
            40,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.8,
        },
      });

      // Cluster Count Layer
      mapRef.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "tasks",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}", // Use abbreviated count for larger numbers
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#000000",
        },
      });

      // Unclustered Point Layer
      mapRef.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "tasks",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#3B82F6", // Default blue for individual points
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      // Click on cluster to zoom
      mapRef.current.on("click", "clusters", (e) => {
        const features = mapRef.current?.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features?.[0].properties?.cluster_id;
        const source = mapRef.current?.getSource(
          "tasks",
        ) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          mapRef.current?.easeTo({
            center: (features?.[0].geometry as any).coordinates,
            zoom: zoom ?? undefined,
          });
        });
      });

      // Click on point to show popup
      mapRef.current.on("click", "unclustered-point", (e) => {
        const coordinates = (
          e.features?.[0].geometry as any
        ).coordinates.slice();
        const { id, status } = e.features?.[0].properties as any;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup({ offset: 15 })
          .setLngLat(coordinates)
          .setHTML(`<h3>Task: ${id}</h3><p>Status: ${status}</p>`)
          .addTo(mapRef.current!);
      });

      // Change cursor on hover
      mapRef.current.on("mouseenter", "clusters", () => {
        mapRef.current!.getCanvas().style.cursor = "pointer";
      });
      mapRef.current.on("mouseleave", "clusters", () => {
        mapRef.current!.getCanvas().style.cursor = "";
      });
      mapRef.current.on("mouseenter", "unclustered-point", () => {
        mapRef.current!.getCanvas().style.cursor = "pointer";
      });
      mapRef.current.on("mouseleave", "unclustered-point", () => {
        mapRef.current!.getCanvas().style.cursor = "";
      });
    }

    function updateSource() {
      const source = mapRef.current?.getSource(
        "tasks",
      ) as mapboxgl.GeoJSONSource;
      if (source) {
        const geojson: any = {
          type: "FeatureCollection",
          features: tasks
            .filter(
              (t) =>
                !isNaN(parseFloat(t.latitude.toString())) &&
                !isNaN(parseFloat(t.longitude.toString())),
            )
            .map((t) => ({
              type: "Feature",
              properties: { id: t.id, status: t.status },
              geometry: {
                type: "Point",
                coordinates: [
                  parseFloat(t.longitude.toString()),
                  parseFloat(t.latitude.toString()),
                ],
              },
            })),
        };
        source.setData(geojson);
      }
    }

    // Fit map to markers if there are tasks and map is loaded
    if (tasks.length > 0 && mapRef.current?.isStyleLoaded()) {
      const bounds = new mapboxgl.LngLatBounds();
      tasks.forEach((task) => {
        const lat =
          typeof task.latitude === "string"
            ? parseFloat(task.latitude)
            : task.latitude;
        const lng =
          typeof task.longitude === "string"
            ? parseFloat(task.longitude)
            : task.longitude;
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lng, lat]);
        }
      });
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
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
            <div className={styles.redPin} />{" "}
            {/* This pin might be misleading now, consider updating its style or removing */}
            <span className={styles.statsTitle}>
              {tasks.length} Tasks Tracked
            </span>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.blue}`} />
              <span>Blue: &lt;100 Tasks</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.yellow}`} />
              <span>Yellow: 100-500 Tasks</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.dot} ${styles.green}`} />
              <span>Green: 500+ Tasks</span>
            </div>
          </div>

          <div className={styles.zoomNotice}>💡 Click clusters to zoom in</div>
        </div>
      </div>
    </div>
  );
}
