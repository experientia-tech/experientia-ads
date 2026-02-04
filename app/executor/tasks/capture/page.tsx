"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronLeft,
  FiCamera,
  FiRotateCw,
  FiZap,
  FiX,
  FiMapPin,
  FiLoader,
} from "react-icons/fi";
import "./capture.scss";
import { uploadFileToS3 } from "@/app/constants/upload";

interface CapturedPhoto {
  dataUrl: string;
  s3Url?: string;
  timestamp: Date;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

const TaskCapture = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [targetLocation, setTargetLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get campaign data and target location from sessionStorage
  useEffect(() => {
    const campaignId = sessionStorage.getItem("currentCampaignId");
    if (campaignId) {
      fetchCampaignData(campaignId);
    }
    getCurrentLocation();

    const timer = setTimeout(() => {
      if (videoRef.current) {
        startCamera();
      } else {
        console.log("Video element not ready, retrying...");
        // Retry after additional delay
        setTimeout(() => {
          if (videoRef.current) {
            startCamera();
          } else {
            console.error("Video element still not found");
          }
        }, 500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const fetchCampaignData = async (campaignId: string) => {
    try {
      const token = localStorage.getItem("executor_token");
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCampaignData(data.data);
          if (data.data.latitude && data.data.longitude) {
            setTargetLocation({
              lat: data.data.latitude,
              lng: data.data.longitude,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching campaign data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    let debounceTimer: NodeJS.Timeout;
    let lastCalculatedDistance: number | null = null;

    const debouncedDistanceCalculation = (
      currentLat: number,
      currentLng: number,
      targetLat: number,
      targetLng: number,
    ) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          targetLat,
          targetLng,
        );

        // Only update if distance changed significantly (more than 0.1 meters)
        if (
          lastCalculatedDistance === null ||
          Math.abs(distance - lastCalculatedDistance) > 0.1
        ) {
          setLocationAccuracy(distance);
          lastCalculatedDistance = distance;
          sessionStorage.setItem("locationAccuracy", JSON.stringify(distance));
        }
      }, 100);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);
        console.log("Initial location obtained:", location);

        // Store GPS accuracy immediately
        sessionStorage.setItem(
          "locationAccuracy",
          JSON.stringify(position.coords.accuracy),
        );
        setLocationAccuracy(position.coords.accuracy);
      },
      (error) => {
        console.error("Error getting initial location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 0,
      },
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);

        if (targetLocation) {
          debouncedDistanceCalculation(
            location.lat,
            location.lng,
            targetLocation.lat,
            targetLocation.lng,
          );
        } else {
          sessionStorage.setItem(
            "locationAccuracy",
            JSON.stringify(position.coords.accuracy),
          );
        }
      },
      (error) => {
        console.error("Error watching location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(debounceTimer);
    };
  }, [targetLocation]);

  useEffect(() => {
    if (currentLocation && targetLocation) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        targetLocation.lat,
        targetLocation.lng,
      );
      setLocationAccuracy(distance);
    }
  }, [currentLocation, targetLocation]);

  const refreshLocation = useCallback(() => {
    console.log("Manually refreshing location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        console.log("Location refreshed successfully:", location);
      },
      (error) => {
        console.error("Manual refresh failed:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    if (lat1 === lat2 && lon1 === lon2) return 0;

    const φ1 = lat1 * 0.017453292519943295;
    const φ2 = lat2 * 0.017453292519943295;
    const Δφ = (lat2 - lat1) * 0.017453292519943295;
    const Δλ = (lon2 - lon1) * 0.017453292519943295;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 6371000 * c;
  };

  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser");
      }
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      console.log("Video element found, requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraActive(true);
      console.log("Camera started successfully");
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Unable to access camera. ";

      if (error.name === "NotAllowedError") {
        errorMessage +=
          "Please grant camera permissions in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera device found.";
      } else if (error.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else if (error.message === "Video element not found") {
        errorMessage +=
          "Camera initialization failed. Please refresh the page.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      alert(errorMessage);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraLoading) return;

    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);

    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newMode);
        startCamera();
      }, 100);
    }
  };

  const toggleFlash = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.torch) {
          videoTrack.applyConstraints({
            advanced: [{ torch: !isFlashOn }] as any,
          });
          setIsFlashOn(!isFlashOn);
        }
      }
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        try {
          setIsUploading(true);
          const file = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
          const s3Url = await uploadFileToS3(file);

          const newPhoto: CapturedPhoto = {
            dataUrl,
            s3Url,
            timestamp: new Date(),
          };

          setCapturedPhotos((prev) => [...prev, newPhoto]);
        } catch (error) {
          console.error("S3 Upload failed:", error);
          alert("Failed to upload image to S3. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const deletePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    stopCamera();
    router.back();
  };

  const handleProceed = () => {
    if (capturedPhotos.length === 3 && currentLocation) {
      // Store all data
      sessionStorage.setItem("capturedPhotos", JSON.stringify(capturedPhotos));
      sessionStorage.setItem("taskLocation", JSON.stringify(currentLocation));
      sessionStorage.setItem(
        "locationAccuracy",
        JSON.stringify(locationAccuracy),
      );

      router.push("/executor/tasks/location");
    } else {
      alert("Please capture 3 photos and ensure location is available");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="task-capture-page">
        <div className="loading-state">
          <p>Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-capture-page">
      <div className="camera-container">
        {/* Camera View */}
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`camera-feed ${isCameraActive ? "active" : "hidden"}`}
          />

          {!isCameraActive && (
            <div className="camera-placeholder">
              {isCameraLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <p>Starting camera...</p>
                </>
              ) : (
                <>
                  <FiCamera size={48} />
                  <p>Tap to start camera</p>
                </>
              )}
            </div>
          )}

          {/* Camera Controls Overlay */}
          <div className="camera-controls">
            <button className="back-btn" onClick={handleBack}>
              <FiChevronLeft size={24} />
            </button>

            <div className="right-controls">
              <button
                className={`flash-btn ${isFlashOn ? "active" : ""}`}
                onClick={toggleFlash}
                title="Toggle Flash"
              >
                <FiZap size={20} />
              </button>

              <button
                className="switch-camera-btn"
                onClick={switchCamera}
                title="Switch Camera"
              >
                <FiRotateCw size={20} />
              </button>
            </div>
          </div>

          {/* Location Status Overlay */}
          {!currentLocation && (
            <div className="location-status-overlay">
              <div className="location-status-content">
                <FiMapPin size={20} />
                <span className="location-text">
                  {isCameraLoading
                    ? "Getting your location..."
                    : "Location not available"}
                </span>
                {!isCameraLoading && (
                  <button
                    className="refresh-location-btn"
                    onClick={() => window.location.reload()}
                    title="Refresh page"
                  >
                    <FiRotateCw size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Coordinates Overlay */}
          {currentLocation && (
            <div className="coordinates-overlay">
              <div className="coordinates-text">
                <span className="coord-label">Lat:</span>
                <span className="coord-value">
                  {currentLocation.lat.toFixed(6)}
                </span>
                <span className="coord-label">Lon:</span>
                <span className="coord-value">
                  {currentLocation.lng.toFixed(6)}
                </span>
              </div>
              {locationAccuracy !== null && (
                <div className="accuracy-indicator-small">
                  <FiMapPin size={12} />
                  <span>±{locationAccuracy.toFixed(1)}m</span>
                </div>
              )}
            </div>
          )}

          {/* Photo Preview Overlay */}
          {capturedPhotos.length > 0 && (
            <div className="photo-preview-overlay">
              <div className="photo-preview-grid">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="photo-preview-item">
                    <img src={photo.dataUrl} alt={`Captured ${index + 1}`} />
                    <button
                      className="delete-photo-btn"
                      onClick={() => deletePhoto(index)}
                      title="Delete photo"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="photo-counter-overlay">
                <span className="counter-text">{capturedPhotos.length}/3</span>
                <div className="progress-dots">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`dot ${num <= capturedPhotos.length ? "filled" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Capture Button Overlay */}
          <div className="capture-button-overlay">
            <button
              className={`capture-btn ${capturedPhotos.length >= 3 || isUploading ? "disabled" : ""}`}
              onClick={isCameraActive ? capturePhoto : toggleCamera}
              disabled={capturedPhotos.length >= 3 || isUploading}
            >
              <div className="capture-btn-inner">
                {isUploading ? (
                  <FiLoader size={32} className="animate-spin" />
                ) : isCameraActive ? (
                  <div className="capture-circle" />
                ) : (
                  <FiCamera size={32} />
                )}
              </div>
            </button>

            {capturedPhotos.length >= 3 && (
              <button className="proceed-btn-overlay" onClick={handleProceed}>
                Proceed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default TaskCapture;
