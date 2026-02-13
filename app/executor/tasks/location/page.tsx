"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiMapPin, FiCheck, FiRotateCcw } from "react-icons/fi";
import dynamic from "next/dynamic";
import "./location.scss";
import SuccessModal from "@/app/experientia/components/success_modal/SuccessModal";

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
  s3Url?: string;
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
  const [isAddressFetching, setIsAddressFetching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Clear all geocoding cache to force fresh lookup
    clearGeocodingCache();

    // Retrieve data from sessionStorage
    const storedLocation = sessionStorage.getItem("taskLocation");
    const storedPhotos = sessionStorage.getItem("capturedPhotos");
    const storedCampaignId = sessionStorage.getItem("currentCampaignId");
    const storedAccuracy = sessionStorage.getItem("locationAccuracy");
    const storedAutoHoodData = sessionStorage.getItem("autoHoodData");

    if (storedLocation && !isAddressFetching) {
      const locationData = JSON.parse(storedLocation);
      setLocation(locationData);
      setFullAddress("Fetching full address...");
      setIsAddressFetching(true);
      getAddressFromCoordinates(locationData).finally(() => {
        setIsAddressFetching(false);
      });
    } else if (!storedLocation) {
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
  const clearGeocodingCache = () => {
    console.log("Clearing all geocoding cache...");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("geocode_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Also clear rate limiting
    localStorage.removeItem("lastGeocodingRequest");

    console.log(`Cleared ${keysToRemove.length} cached geocoding entries`);
  };


  const getAddressFromCoordinates = async (coords: LocationData) => {
    console.log("=== Starting address lookup via Mapbox (Aligned) ===");
    const cacheKey = `geocode_${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`;

    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 3600000) {
          console.log("Using cached address:", cachedData.address);
          setFullAddress(cachedData.address);
          return;
        }
      } catch (e) {
        console.log("Cache parse failed:", e);
      }
    }

    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        throw new Error("Mapbox token not found");
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const bestFeature = data.features.find((f: any) =>
          f.place_type.includes('address') ||
          f.place_type.includes('poi')
        ) || data.features[0];

        // Construct a truly full address from feature + context
        let addressParts = [];

        // Add street number and street name
        if (bestFeature.address) {
          addressParts.push(bestFeature.address);
        }
        if (bestFeature.text) {
          addressParts.push(bestFeature.text);
        }

        // Add context parts (Neighborhood, Locality, Place, District, etc.)
        if (bestFeature.context) {
          bestFeature.context.forEach((ctx: any) => {
            addressParts.push(ctx.text);
          });
        }

        // If we couldn't build it manually, fall back to place_name
        const address = addressParts.length > 0
          ? Array.from(new Set(addressParts)).join(", ")
          : bestFeature.place_name;

        console.log("Full Address constructed:", address);
        setFullAddress(address);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            address: address,
            timestamp: Date.now(),
          })
        );
      } else {
        const fallbackAddress = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        setFullAddress(fallbackAddress);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      const fallbackAddress = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      setFullAddress(fallbackAddress);
    }
  };

  const handleRetakePhotos = () => {
    sessionStorage.removeItem("capturedPhotos");
    sessionStorage.removeItem("taskLocation");
    sessionStorage.removeItem("locationAccuracy");
    router.push("/executor/tasks/capture");
  };

  const clearCurrentAddressCache = () => {
    if (location) {
      const cacheKey = `geocode_${location.lat.toFixed(6)}_${location.lng.toFixed(6)}`;
      localStorage.removeItem(cacheKey);
      console.log("Cleared cache for current location:", cacheKey);
    }
  };

  const handleSubmit = async () => {
    if (!campaignId) {
      alert("Campaign ID not found. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("executor_token");
      const storedAutoHoodData = sessionStorage.getItem("autoHoodData");
      let autoHoodData = {};

      if (storedAutoHoodData) {
        try {
          autoHoodData = JSON.parse(storedAutoHoodData);
        } catch (error) {
          console.error("Error parsing Auto Hood data:", error);
        }
      }

      const taskData = {
        images: capturedPhotos.map((photo) => ({
          url: photo.s3Url || photo.dataUrl,
        })),
        latitude: location?.lat,
        longitude: location?.lng,
        address: fullAddress,
        accuracy: locationAccuracy?.toString() || "0",
        metadata: {
          ...autoHoodData,
        },
      };

      const response = await fetch(
        `/api/executor/campaigns/${campaignId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        },
      );

      if (response.ok) {
        const result = await response.json();

        sessionStorage.removeItem("capturedPhotos");
        sessionStorage.removeItem("taskLocation");
        sessionStorage.removeItem("locationAccuracy");
        sessionStorage.removeItem("autoHoodData");

        setShowSuccess(true);
      } else {
        const error = await response.json();
        alert(`Failed to submit task: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      alert("Error submitting task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
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
            <button
              className="refresh-address-btn"
              onClick={() => {
                if (!isAddressFetching) {
                  clearCurrentAddressCache();
                  if (location) {
                    setFullAddress("Refreshing address...");
                    setIsAddressFetching(true);
                    getAddressFromCoordinates(location).finally(() => {
                      setIsAddressFetching(false);
                    });
                  }
                }
              }}
              title="Refresh address"
              disabled={isAddressFetching}
            >
              <FiRotateCcw size={16} />
            </button>
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
                <span className="coord-value">
                  {locationAccuracy.toFixed(2)}m
                </span>
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

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Task Submitted!"
        message="Your task evidence has been successfully submitted for review."
      />
    </div>
  );
};

export default TaskLocation;
