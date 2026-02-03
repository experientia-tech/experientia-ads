"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiCamera, FiRotateCw, FiZap, FiX, FiMapPin } from "react-icons/fi";
import "./capture.scss";

interface CapturedPhoto {
  dataUrl: string;
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Get campaign data and target location from sessionStorage
  useEffect(() => {
    const campaignId = sessionStorage.getItem('currentCampaignId');
    if (campaignId) {
      // Fetch campaign data to get target location
      fetchCampaignData(campaignId);
    }
    getCurrentLocation();
    
    // Delay camera start to ensure video element is mounted
    const timer = setTimeout(() => {
      // Check if video element exists before starting camera
      if (videoRef.current) {
        startCamera();
      } else {
        console.log('Video element not ready, retrying...');
        // Retry after additional delay
        setTimeout(() => {
          if (videoRef.current) {
            startCamera();
          } else {
            console.error('Video element still not found');
          }
        }, 500);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchCampaignData = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('executor_token');
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCampaignData(data.data);
          if (data.data.latitude && data.data.longitude) {
            setTargetLocation({
              lat: data.data.latitude,
              lng: data.data.longitude
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    let debounceTimer: NodeJS.Timeout;
    let lastCalculatedDistance: number | null = null;

    // Debounced distance calculation
    const debouncedDistanceCalculation = (currentLat: number, currentLng: number, targetLat: number, targetLng: number) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
        
        // Only update if distance changed significantly (more than 0.1 meters)
        if (lastCalculatedDistance === null || Math.abs(distance - lastCalculatedDistance) > 0.1) {
          setLocationAccuracy(distance);
          lastCalculatedDistance = distance;
          sessionStorage.setItem('locationAccuracy', JSON.stringify(distance));
        }
      }, 100); // 100ms debounce
    };

    // Get immediate location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
        console.log('Initial location obtained:', location);
        
        // Store GPS accuracy immediately
        sessionStorage.setItem('locationAccuracy', JSON.stringify(position.coords.accuracy));
        setLocationAccuracy(position.coords.accuracy);
      },
      (error) => {
        console.error('Error getting initial location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 0
      }
    );

    // Then watch for updates with optimized frequency
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
        
        // Calculate distance from target if available (with debouncing)
        if (targetLocation) {
          debouncedDistanceCalculation(
            location.lat,
            location.lng,
            targetLocation.lat,
            targetLocation.lng
          );
        } else {
          // Update GPS accuracy if no target
          sessionStorage.setItem('locationAccuracy', JSON.stringify(position.coords.accuracy));
        }
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 1000 // Allow 1 second cache to reduce updates
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(debounceTimer);
    };
  }, [targetLocation]);

  // Calculate distance when both currentLocation and targetLocation are available
  useEffect(() => {
    if (currentLocation && targetLocation) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      );
      setLocationAccuracy(distance);
    }
  }, [currentLocation, targetLocation]);

  // Optimized distance calculation using Haversine formula with early returns
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Early return if coordinates are identical
    if (lat1 === lat2 && lon1 === lon2) return 0;
    
    // Convert to radians
    const φ1 = lat1 * 0.017453292519943295; // Math.PI / 180
    const φ2 = lat2 * 0.017453292519943295;
    const Δφ = (lat2 - lat1) * 0.017453292519943295;
    const Δλ = (lon2 - lon1) * 0.017453292519943295;

    // Haversine formula
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return 6371000 * c; // Earth's radius in meters
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser');
      }
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      console.log('Video element found, requesting camera access...');

      // Request camera permission with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraActive(true);
      console.log('Camera started successfully');
      
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please grant camera permissions in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera device found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.message === 'Video element not found') {
        errorMessage += 'Camera initialization failed. Please refresh the page.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      alert(errorMessage);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
    const newMode = facingMode === 'user' ? 'environment' : 'user';
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
            advanced: [{ torch: !isFlashOn }] as any
          });
          setIsFlashOn(!isFlashOn);
        }
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const newPhoto: CapturedPhoto = {
          dataUrl,
          timestamp: new Date()
        };
        
        setCapturedPhotos(prev => [...prev, newPhoto]);
      }
    }
  };

  const deletePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    stopCamera();
    router.back();
  };

  const handleProceed = () => {
    if (capturedPhotos.length === 3 && currentLocation) {
      // Store all data
      sessionStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
      sessionStorage.setItem('taskLocation', JSON.stringify(currentLocation));
      sessionStorage.setItem('locationAccuracy', JSON.stringify(locationAccuracy));
      
      router.push('/executor/tasks/location');
    } else {
      alert('Please capture 3 photos and ensure location is available');
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
            className={`camera-feed ${isCameraActive ? 'active' : 'hidden'}`}
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
                className={`flash-btn ${isFlashOn ? 'active' : ''}`}
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
        </div>

        {/* Service Name */}
        <div className="service-info">
          <h3>{campaignData?.serviceType || 'Campaign Task'}</h3>
        </div>

        {/* Photo Preview Section */}
        {capturedPhotos.length > 0 && (
          <div className="photo-preview-section">
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
          </div>
        )}

        {/* Photo Counter */}
        <div className="photo-counter">
          <span className="counter-text">{capturedPhotos.length}/3 photos taken</span>
          <div className="progress-dots">
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`dot ${num <= capturedPhotos.length ? 'filled' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Location Accuracy */}
        <div className="location-accuracy">
          <div className="accuracy-info">
            <FiMapPin size={16} />
            <span className="accuracy-text">
              {currentLocation ? (
                locationAccuracy !== null 
                  ? `Location accuracy: ${locationAccuracy.toFixed(1)}m`
                  : targetLocation 
                    ? 'Calculating distance to target...'
                    : 'Loading target location...'
              ) : (
                'Getting your location...'
              )}
            </span>
          </div>
          {locationAccuracy !== null && (
            <div className={`accuracy-indicator ${
              locationAccuracy <= 10 ? 'good' : 
              locationAccuracy <= 25 ? 'fair' : 'poor'
            }`} />
          )}
        </div>

        {/* Capture Button */}
        <div className="capture-section">
          <button 
            className={`capture-btn ${capturedPhotos.length >= 3 ? 'disabled' : ''}`}
            onClick={isCameraActive ? capturePhoto : toggleCamera}
            disabled={capturedPhotos.length >= 3}
          >
            <div className="capture-btn-inner">
              {isCameraActive ? (
                <div className="capture-circle" />
              ) : (
                <FiCamera size={32} />
              )}
            </div>
          </button>
          
          {capturedPhotos.length >= 3 && (
            <button className="proceed-btn" onClick={handleProceed}>
              Proceed
            </button>
          )}
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default TaskCapture;