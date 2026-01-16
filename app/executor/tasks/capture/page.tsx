"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiCamera, FiCheck } from "react-icons/fi";
import "./capture.scss";

const TaskCapture = () => {
  const router = useRouter();
  const [capturedPhotos, setCapturedPhotos] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const handlePhotoCapture = (index: number) => {
    // Placeholder for camera functionality
    const newCapturedPhotos = [...capturedPhotos];
    newCapturedPhotos[index] = true;
    setCapturedPhotos(newCapturedPhotos);
  };

  const handleProceed = () => {
    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Store location in sessionStorage to pass to next page
        sessionStorage.setItem("taskLocation", JSON.stringify({ lat, lng }));

        // Navigate to location verification page
        router.push("/executor/tasks/location");
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(
          "Unable to get your location. Please enable location services and try again."
        );
        setIsCapturingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="task-capture-page">
      <header className="capture-header">
        <button className="back-btn" onClick={() => router.back()}>
          <FiChevronLeft size={24} />
        </button>
        <h1 className="header-title">Capture Task Photos</h1>
      </header>

      <div className="capture-content">
        <div className="instructions">
          <h2 className="instructions-title">Take 3 Photos</h2>
          <p className="instructions-text">
            Capture clear photos of the billboard from different angles
          </p>
        </div>

        <div className="photo-sections">
          {[1, 2, 3].map((photoNum, index) => (
            <div
              key={photoNum}
              className={`photo-section ${
                capturedPhotos[index] ? "captured" : ""
              }`}
              onClick={() => handlePhotoCapture(index)}
            >
              <div className="photo-icon-wrapper">
                {capturedPhotos[index] ? (
                  <FiCheck size={48} className="check-icon" />
                ) : (
                  <FiCamera size={48} className="camera-icon" />
                )}
              </div>
              <div className="photo-info">
                <h3 className="photo-title">Photo {photoNum}</h3>
                <p className="photo-status">
                  {capturedPhotos[index] ? "Captured" : "Tap to capture"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {capturedPhotos.every((photo) => photo) && (
        <div className="footer-action">
          <button
            className="continue-btn primary-button"
            onClick={handleProceed}
            disabled={isCapturingLocation}
          >
            {isCapturingLocation
              ? "Getting location..."
              : "Proceed to next page"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCapture;
