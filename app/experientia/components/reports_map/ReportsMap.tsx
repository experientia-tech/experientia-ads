"use client";

import { useEffect, useRef, useState } from "react";
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
  campaignLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    name: string;
    address?: string | null;
  };
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function ReportsMap({ tasks, totalTasks, campaignLocation }: ReportsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const campaignMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [showCampaignLocation, setShowCampaignLocation] = useState(true);

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
          "text-field": "{point_count_abbreviated}",
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
          "circle-color": "#3B82F6",
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

      const campaignLat = campaignLocation?.latitude ? parseFloat(campaignLocation.latitude.toString()) : null;
      const campaignLng = campaignLocation?.longitude ? parseFloat(campaignLocation.longitude.toString()) : null;
      if (showCampaignLocation && campaignLat !== null && campaignLng !== null && !isNaN(campaignLat) && !isNaN(campaignLng)) {
        bounds.extend([campaignLng, campaignLat]);
      }

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
    return () => {
      campaignMarkerRef.current?.remove();
      campaignMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tasks, showCampaignLocation, campaignLocation]);

  // Manage campaign target location marker
  useEffect(() => {
    if (!mapRef.current) return;

    const lat = campaignLocation?.latitude ? parseFloat(campaignLocation.latitude.toString()) : null;
    const lng = campaignLocation?.longitude ? parseFloat(campaignLocation.longitude.toString()) : null;

    if (!showCampaignLocation || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      if (campaignMarkerRef.current) {
        campaignMarkerRef.current.remove();
        campaignMarkerRef.current = null;
      }
      return;
    }

    if (campaignMarkerRef.current) {
      campaignMarkerRef.current.setLngLat([lng, lat]);
      return;
    }

    const el = document.createElement("div");
    el.className = styles.campaignTargetMarker;
    el.innerHTML = `
      <div class="${styles.targetPinOuter}">
        <div class="${styles.targetPinInner}"></div>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
        <h4 style="margin: 0 0 4px 0; color: #7c3aed; font-weight: 700; font-size: 13px;">Target Campaign Location</h4>
        <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${campaignLocation?.name || ""}</p>
        <p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${campaignLocation?.address || "No address provided"}</p>
        <p style="margin: 4px 0 0 0; font-size: 9px; font-family: monospace; color: #94a3b8;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</p>
      </div>
    `);

    campaignMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapRef.current);
  }, [showCampaignLocation, campaignLocation, mapRef.current]);

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
            {showCampaignLocation && campaignLocation?.latitude && campaignLocation?.longitude && (
              <div className={styles.legendItem}>
                <div className={`${styles.dot} ${styles.purple}`} />
                <span>Purple: Target Location</span>
              </div>
            )}
          </div>

          {campaignLocation?.latitude && campaignLocation?.longitude && (
            <div className={styles.toggleContainer}>
              <hr className={styles.divider} />
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showCampaignLocation}
                  onChange={(e) => setShowCampaignLocation(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleText}>Show Target Location</span>
              </label>
            </div>
          )}

          <div className={styles.zoomNotice}>💡 Click clusters to zoom in</div>
        </div>
      </div>
    </div>
  );
}
