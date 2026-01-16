"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiMapPin, FiCheck } from "react-icons/fi";
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

const TaskLocation = () => {
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [placeName, setPlaceName] = useState("");

  useEffect(() => {
    // Retrieve location from sessionStorage
    const storedLocation = sessionStorage.getItem("taskLocation");
    if (storedLocation) {
      setLocation(JSON.parse(storedLocation));
    } else {
      // If no location, redirect back to capture page
      router.push("/executor/tasks/capture");
    }
  }, [router]);

  const handleSubmit = () => {
    if (!placeName.trim()) {
      alert("Please enter the exact place name");
      return;
    }

    // Store place name and proceed
    sessionStorage.setItem("taskPlaceName", placeName);

    // Navigate to next step (you can change this route as needed)
    alert(
      `Location verified!\nPlace: ${placeName}\nCoordinates: ${location?.lat}, ${location?.lng}`
    );
    router.push("/executor/dashboard");
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
        <div className="instructions">
          <h2 className="instructions-title">Confirm Your Location</h2>
          <p className="instructions-text">
            Verify the location on the map and enter the exact place name
          </p>
        </div>

        <div className="map-container">
          <MapComponent lat={location.lat} lng={location.lng} />
        </div>

        <div className="coordinates-display">
          <FiMapPin size={20} />
          <div className="coords-text">
            <span className="coords-label">Coordinates</span>
            <span className="coords-value">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </span>
          </div>
        </div>

        <div className="place-input-section">
          <label htmlFor="placeName" className="input-label">
            Exact Place Name
          </label>
          <input
            id="placeName"
            type="text"
            className="place-input"
            placeholder="e.g., Times Square, New York"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
        </div>
      </div>

      <div className="footer-action">
        <button
          className="submit-btn primary-button"
          onClick={handleSubmit}
          disabled={!placeName.trim()}
        >
          <FiCheck size={20} />
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default TaskLocation;
