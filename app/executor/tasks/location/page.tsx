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
  s3Url?: string; // Optional S3 URL
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

    // Store auto hood data for later use in submission
    if (storedAutoHoodData) {
      // We'll use this in the handleSubmit function
      console.log('Auto Hood data found:', JSON.parse(storedAutoHoodData));
    }
  }, [router]);

  // Function to clear all geocoding cache
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

  // Helper function to add delay
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function to filter out unwanted geographic regions
  const isUnwantedGeographicItem = (
    name: string,
    description?: string,
  ): boolean => {
    const unwantedNames = [
      "Asia",
      "Asia/Kolkata",
      "Indian subcontinent",
      "Mainland India",
      "Southern Zonal Council",
      "South Western Railway",
      "Kaveri River Basin",
    ];

    const unwantedDescriptions = [
      "continent",
      "time zone",
      "subcontinent",
      "Zonal Council",
      "Railway",
      "River Basin",
    ];

    return (
      unwantedNames.some((unwanted) => name.includes(unwanted)) ||
      unwantedDescriptions.some((unwanted) => description?.includes(unwanted))
    );
  };

  const getAddressFromCoordinates = async (coords: LocationData) => {
    console.log("=== Starting FULL address lookup ===");
    console.log("Input coordinates:", coords);

    const cacheKey = `geocode_${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`;
    console.log("Cache key:", cacheKey);

    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        console.log("Found cached data:", cachedData);
        if (Date.now() - cachedData.timestamp < 3600000) {
          // 1 hour cache
          console.log("Using cached address:", cachedData.address);
          setFullAddress(cachedData.address);
          return;
        }
      } catch (e) {
        console.log("Cache parse failed, fetching fresh data:", e);
      }
    }

    try {
      console.log("Getting FULL address for coordinates:", coords);

      // Try BigDataCloud for full address construction
      try {
        console.log("Trying BigDataCloud for full address...");
        const response = await fetch(
          `/api/geocode?lat=${coords.lat}&lon=${coords.lng}&provider=bigdatacloud`,
          {
            signal: AbortSignal.timeout(10000),
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log("BigDataCloud full response:", result);
          const parts: string[] = [];
          if (result.localityInfo?.informative) {
            const streetItems = result.localityInfo.informative.filter(
              (item: any) =>
                item.description?.includes("human settlement") ||
                item.description?.includes("street") ||
                item.description?.includes("road") ||
                item.description?.includes("building") ||
                item.description?.includes("house") ||
                (item.name &&
                  !item.description?.includes("postal code") &&
                  !isUnwantedGeographicItem(item.name, item.description)),
            );

            streetItems.forEach((item: any) => {
              if (item.name && !parts.includes(item.name)) {
                parts.push(item.name);
              }
            });
          }
          if (result.localityInfo?.informative) {
            const building = result.localityInfo.informative.find(
              (item: any) =>
                item.description === "building" || item.description === "house",
            );
            if (building && building.name && !parts.includes(building.name)) {
              parts.unshift(building.name);
            }

            const road = result.localityInfo.informative.find(
              (item: any) =>
                item.description === "road" || item.description === "street",
            );
            if (road && road.name && !parts.includes(road.name)) {
              parts.push(road.name);
            }
          }

          if (result.localityInfo?.administrative) {
            const neighborhood = result.localityInfo.administrative.find(
              (item: any) =>
                (item.order === 8 ||
                  item.order === 9 ||
                  item.description?.includes("City Corporation")) &&
                !isUnwantedGeographicItem(item.name, item.description),
            );
            if (
              neighborhood &&
              neighborhood.name &&
              !parts.includes(neighborhood.name)
            ) {
              parts.push(neighborhood.name);
            }
          }

          if (result.locality && !parts.includes(result.locality)) {
            parts.push(result.locality);
          }

          if (
            result.city &&
            result.city !== result.locality &&
            !parts.includes(result.city)
          ) {
            parts.push(result.city);
          }

          if (result.localityInfo?.administrative) {
            const district = result.localityInfo.administrative.find(
              (item: any) =>
                (item.order === 6 ||
                  item.order === 7 ||
                  item.description?.includes("district")) &&
                !isUnwantedGeographicItem(item.name, item.description),
            );
            if (district && district.name && !parts.includes(district.name)) {
              parts.push(district.name);
            }
          }

          if (
            result.principalSubdivision &&
            !parts.includes(result.principalSubdivision)
          ) {
            parts.push(result.principalSubdivision);
          }

          if (result.postcode && !parts.includes(result.postcode)) {
            parts.push(result.postcode);
          }

          if (result.countryName && !parts.includes(result.countryName)) {
            parts.push(result.countryName);
          }
          if (result.countryName && !parts.includes(result.countryName)) {
            parts.push(result.countryName);
          }

          const address = parts.filter(Boolean).join(", ");

          if (address && address.length > 20) {
            // Ensure we got a meaningful address
            console.log("Full address found via BigDataCloud:", address);
            setFullAddress(address);
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                address: address,
                timestamp: Date.now(),
              }),
            );
            return;
          }
        }
      } catch (bigdataError) {
        console.log("BigDataCloud service failed:", bigdataError);
      }

      await delay(1500);
      try {
        const opencageKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
        if (opencageKey) {
          console.log("Trying OpenCage for full address...");
          const response = await fetch(
            `/api/geocode?lat=${coords.lat}&lon=${coords.lng}&provider=opencage`,
            {
              signal: AbortSignal.timeout(10000),
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            console.log("OpenCage full response:", result);

            if (result.results && result.results.length > 0) {
              const addressData = result.results[0];

              // Try formatted address first
              if (addressData.formatted) {
                const address = addressData.formatted;
                console.log("Full address found via OpenCage:", address);
                setFullAddress(address);
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({
                    address: address,
                    timestamp: Date.now(),
                  }),
                );
                return;
              }

              // Build from components as fallback
              const components = addressData.components;
              if (components) {
                const parts = [];

                if (components.house_number)
                  parts.push(components.house_number);
                if (components.road) parts.push(components.road);
                if (components.neighbourhood)
                  parts.push(components.neighbourhood);
                if (components.suburb) parts.push(components.suburb);
                if (components.city || components.town || components.village) {
                  parts.push(
                    components.city || components.town || components.village,
                  );
                }
                if (components.state_district)
                  parts.push(components.state_district);
                if (components.state) parts.push(components.state);
                if (components.postcode) parts.push(components.postcode);
                if (components.country) parts.push(components.country);

                const address = parts.join(", ");
                if (address) {
                  console.log(
                    "Full address built from OpenCage components:",
                    address,
                  );
                  setFullAddress(address);
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({
                      address: address,
                      timestamp: Date.now(),
                    }),
                  );
                  return;
                }
              }
            }
          }
        }
      } catch (opencageError) {
        console.log("OpenCage service failed:", opencageError);
      }

      await delay(1500);
      try {
        const locationiqKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
        if (locationiqKey) {
          console.log("Trying LocationIQ for full address...");
          const response = await fetch(
            `/api/geocode?lat=${coords.lat}&lon=${coords.lng}&provider=locationiq`,
            {
              signal: AbortSignal.timeout(10000),
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            console.log("LocationIQ full response:", result);

            if (result && result.display_name) {
              const address = result.display_name;
              console.log("Full address found via LocationIQ:", address);
              setFullAddress(address);
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  address: address,
                  timestamp: Date.now(),
                }),
              );
              return;
            }
          }
        }
      } catch (locationiqError) {
        console.log("LocationIQ service failed:", locationiqError);
      }

      await delay(1500);

      try {
        console.log("Trying Photon for full address...");
        const response = await fetch(
          `/api/geocode?lat=${coords.lat}&lon=${coords.lng}&provider=photon`,
          {
            signal: AbortSignal.timeout(10000),
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log("Photon full response:", result);

          if (result.features && result.features.length > 0) {
            const properties = result.features[0].properties;
            const parts = [];

            if (properties.housenumber) parts.push(properties.housenumber);
            if (properties.street) parts.push(properties.street);
            if (properties.district) parts.push(properties.district);
            if (properties.city) parts.push(properties.city);
            if (properties.state) parts.push(properties.state);
            if (properties.postcode) parts.push(properties.postcode);
            if (properties.country) parts.push(properties.country);

            const address = parts.filter(Boolean).join(", ");

            if (address && address.length > 20) {
              console.log("Full address found via Photon:", address);
              setFullAddress(address);
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  address: address,
                  timestamp: Date.now(),
                }),
              );
              return;
            }
          }
        }
      } catch (photonError) {
        console.log("Photon service failed:", photonError);
      }

      // If all services fail, create a descriptive fallback
      throw new Error("All geocoding services failed to retrieve full address");
    } catch (error) {
      console.error("Full address geocoding failed:", error);

      // Create a user-friendly fallback address with coordinates
      const lat = coords.lat.toFixed(6);
      const lng = coords.lng.toFixed(6);
      const fallbackAddress = `Location: ${lat}°N, ${lng}°E (Full address lookup unavailable)`;

      console.log("Using fallback address:", fallbackAddress);
      setFullAddress(fallbackAddress);

      // Cache fallback to avoid repeated failed requests
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          address: fallbackAddress,
          timestamp: Date.now(),
        }),
      );
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
      const token = localStorage.getItem('executor_token');
      
      // Get auto hood data if available
      const storedAutoHoodData = sessionStorage.getItem('autoHoodData');
      const autoHoodData = storedAutoHoodData ? JSON.parse(storedAutoHoodData) : null;
      
      const taskData = {
        images: capturedPhotos.map((photo) => ({
          url: photo.s3Url || photo.dataUrl,
        })),
        latitude: location?.lat,
        longitude: location?.lng,
        address: fullAddress,
        accuracy: locationAccuracy?.toString() || "0",
        ...(autoHoodData && {
          metadata: {
            driverName: autoHoodData.driverName,
            phoneNumber: autoHoodData.phoneNumber,
            vehicleNumber: autoHoodData.vehicleNumber,
          }
        })
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
        
        alert("Task submitted successfully!");
        router.push("/executor/dashboard");
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
