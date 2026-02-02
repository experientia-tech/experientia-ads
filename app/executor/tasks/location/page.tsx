"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiMapPin, FiCheck, FiRotateCcw } from "react-icons/fi";
import dynamic from "next/dynamic";
import "./location.scss";

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <p>Loading map...</p>
    </div>
  ),
});

interface LocationData {
  lat: number;
  lng: number;
}

interface CapturedPhoto {
  dataUrl: string;
  timestamp: Date;
}

const TaskLocation = () => {
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [fullAddress, setFullAddress] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [campaignId, setCampaignId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Retrieve data from sessionStorage
    const storedLocation = sessionStorage.getItem("taskLocation");
    const storedPhotos = sessionStorage.getItem("capturedPhotos");
    const storedCampaignId = sessionStorage.getItem("currentCampaignId");
    const storedAccuracy = sessionStorage.getItem("locationAccuracy");
    
    if (storedLocation) {
      const locationData = JSON.parse(storedLocation);
      setLocation(locationData);
      setFullAddress(`Getting address... (${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)})`);
      getAddressFromCoordinates(locationData);
    } else {
      router.push("/executor/tasks/capture");
    }

    if (storedPhotos) {
      setCapturedPhotos(JSON.parse(storedPhotos));
    }

    if (storedCampaignId) {
      setCampaignId(storedCampaignId);
    }

    if (storedAccuracy) {
      setLocationAccuracy(JSON.parse(storedAccuracy));
    }
  }, [router]);

  const getAddressFromCoordinates = async (coords: LocationData) => {
    const cacheKey = `geocode_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 3600000) { // 1 hour cache
          setFullAddress(cachedData.address);
          return;
        }
      } catch (e) {
        console.log('Cache parse failed, fetching fresh data');
      }
    }

    try {
      console.log('Getting address for:', coords);
      
      // Create multiple geocoding promises to run in parallel
      const geocodingPromises = [
        // OpenStreetMap Nominatim
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1&zoom=18`,
          {
            headers: { 'User-Agent': 'ExperientiaApp/1.0' },
            signal: AbortSignal.timeout(2000) // 2 second timeout
          }
        ).then(res => res.ok ? res.json() : Promise.reject()),
        
        // Alternative Nominatim endpoint
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          {
            headers: { 'User-Agent': 'ExperientiaApp/1.0' },
            signal: AbortSignal.timeout(2000)
          }
        ).then(res => res.ok ? res.json() : Promise.reject())
      ];

      // Race the promises - use first successful response
      try {
        const result = await Promise.race(geocodingPromises);
        if (result && result.display_name) {
          setFullAddress(result.display_name);
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            address: result.display_name,
            timestamp: Date.now()
          }));
          return;
        }
      } catch (error) {
        console.log('All geocoding services failed or timed out');
      }

      // Fallback to coordinates
      const lat = coords.lat.toFixed(4);
      const lng = coords.lng.toFixed(4);
      const fallbackAddress = `Location (${lat}, ${lng})`;
      setFullAddress(fallbackAddress);
      
      // Cache fallback too
      localStorage.setItem(cacheKey, JSON.stringify({
        address: fallbackAddress,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error("Geocoding failed:", error);
      const fallbackAddress = `Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
      setFullAddress(fallbackAddress);
    }
  };

  const handleRetakePhotos = () => {
    sessionStorage.removeItem("capturedPhotos");
    sessionStorage.removeItem("taskLocation");
    sessionStorage.removeItem("locationAccuracy");
    router.push("/executor/tasks/capture");
  };

  const handleSubmit = async () => {
    if (!campaignId) {
      alert("Campaign ID not found. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('executor_token');
      
      const taskData = {
        images: capturedPhotos.map(photo => ({
          url: photo.dataUrl 
        })),
        latitude: location?.lat,
        longitude: location?.lng,
        address: fullAddress,
        accuracy: locationAccuracy?.toString() || "0"
      };

      const response = await fetch(`/api/executor/campaigns/${campaignId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        
        sessionStorage.removeItem("capturedPhotos");
        sessionStorage.removeItem("taskLocation");
        sessionStorage.removeItem("locationAccuracy");
        
        alert("Task submitted successfully!");
        router.push("/executor/dashboard");
      } else {
        const error = await response.json();
        alert(`Failed to submit task: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      alert("Error submitting task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) {
    return (
      <div className="task-location-page">
        <div className="loading-state">
          <p>Loading location data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-location-page">
      <header className="location-header">
        <button className="back-btn" onClick={() => router.back()}>
          <FiChevronLeft size={24} />
        </button>
        <h1 className="header-title">Verify Location</h1>
      </header>

      <div className="location-content">
        <div className="captured-photos-section">
          <h3 className="section-title">Captured Photos</h3>
          <div className="photos-grid">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="photo-item">
                <img src={photo.dataUrl} alt={`Captured ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="map-container">
          <MapComponent lat={location.lat} lng={location.lng} />
        </div>

        <div className="address-section">
          <div className="address-header">
            <FiMapPin size={20} />
            <span className="address-title">Full Address</span>
          </div>
          <div className="address-display">
            {fullAddress || "Fetching address..."}
          </div>
        </div>

        <div className="coordinates-section">
          <div className="coords-header">
            <FiMapPin size={20} />
            <span className="coords-title">Latitude & Longitude</span>
          </div>
          <div className="coords-display">
            <div className="coord-item">
              <span className="coord-label">Latitude:</span>
              <span className="coord-value">{location.lat.toFixed(6)}</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">Longitude:</span>
              <span className="coord-value">{location.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="retake-btn" onClick={handleRetakePhotos}>
          <FiRotateCcw size={20} />
          Retake Photos
        </button>
        <button
          className="submit-btn primary-button"
          onClick={handleSubmit}
          disabled={isSubmitting || !fullAddress}
        >
          <FiCheck size={20} />
          {isSubmitting ? "Submitting..." : "Submit Task"}
        </button>
      </div>
    </div>
  );
};

export default TaskLocation;
