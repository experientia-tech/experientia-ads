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

  // Helper function to add delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Rate limiting - respect Nominatim's 1 request per second policy
    const lastRequest = localStorage.getItem('lastGeocodingRequest');
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - parseInt(lastRequest);
      if (timeSinceLastRequest < 1000) {
        await delay(1000 - timeSinceLastRequest);
      }
    }
    localStorage.setItem('lastGeocodingRequest', Date.now().toString());

    try {
      console.log('Getting address for:', coords);
      
      // Try primary service first with longer timeout
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`,
          {
            headers: { 'User-Agent': 'ExperientiaApp/1.0' },
            signal: AbortSignal.timeout(5000) // Increased to 5 seconds
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          if (result && result.display_name) {
            setFullAddress(result.display_name);
            localStorage.setItem(cacheKey, JSON.stringify({
              address: result.display_name,
              timestamp: Date.now()
            }));
            return;
          }
        }
      } catch (primaryError) {
        console.log('Primary geocoding service failed, trying alternative...');
      }
      
      // If primary fails, wait a bit and try alternative format
      await delay(1000);
      
      try {
        const response2 = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          {
            headers: { 'User-Agent': 'ExperientiaApp/1.0' },
            signal: AbortSignal.timeout(5000)
          }
        );

        if (response2.ok) {
          const result2 = await response2.json();
          
          if (result2 && result2.display_name) {
            setFullAddress(result2.display_name);
            localStorage.setItem(cacheKey, JSON.stringify({
              address: result2.display_name,
              timestamp: Date.now()
            }));
            return;
          }
        }
      } catch (secondaryError) {
        console.log('Secondary geocoding service also failed');
      }

      // If both fail, use fallback
      throw new Error('All geocoding attempts failed');
      
    } catch (error) {
      console.error("Geocoding failed:", error);
      const fallbackAddress = `Location at ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      setFullAddress(fallbackAddress);
      
      // Cache fallback too to avoid repeated failed requests
      localStorage.setItem(cacheKey, JSON.stringify({
        address: fallbackAddress,
        timestamp: Date.now()
      }));
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
            {locationAccuracy && (
              <div className="coord-item">
                <span className="coord-label">Accuracy:</span>
                <span className="coord-value">{locationAccuracy.toFixed(2)}m</span>
              </div>
            )}
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