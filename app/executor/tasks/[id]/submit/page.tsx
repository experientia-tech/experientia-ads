"use client";
import React from "react";
import {
  FiChevronLeft,
  FiCamera,
  FiX,
  FiCheck,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";
import "./submit-task.scss";

const SubmitTask = () => {
  return (
    <div className="submit-task-page">
      <header className="details-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <FiChevronLeft size={24} />
        </button>
        <h1 className="header-title">Task #4092: Billboard Install</h1>
      </header>

      <section className="form-section">
        <div className="section-header">
          <h3 className="section-title">Evidence Photos</h3>
          <span className="count-badge">1/3 Captured</span>
        </div>

        <div className="photo-grid">
          <div className="photo-slot captured">
            <div className="image-mock">
              {/* Representing the sky view from screenshot */}
              <div className="sky-view"></div>
            </div>
            <button className="delete-btn">
              <FiX />
            </button>
            <div className="photo-label">
              <FiCheck className="check-icon" />
              <span>Photo 1 : Wiring Detail</span>
            </div>
          </div>

          <div className="photo-slot empty">
            <FiCamera size={32} />
            <div className="slot-info">
              <p className="slot-name">Photo 2</p>
              <p className="slot-hint">Tap to capture</p>
            </div>
          </div>

          <div className="photo-slot empty">
            <FiCamera size={32} />
            <div className="slot-info">
              <p className="slot-name">Photo 3</p>
              <p className="slot-hint">Tap to capture</p>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-title">GPS Verification</h3>

        <div className="gps-card design-card">
          <div className="gps-main">
            <div className="gps-icon">
              <FiMapPin size={24} />
            </div>
            <div className="gps-data">
              <p className="data-label">COORDINATES</p>
              <h4 className="coords">40.7128° N, 74.0060° W</h4>
              <p className="accuracy">Accuracy: ±5m</p>
            </div>
            <button className="refresh-btn">
              <FiRefreshCw size={20} />
            </button>
          </div>

          <div className="map-mockup">
            {/* Simple representation of the map from screenshot */}
            <div className="map-img">
              <div className="map-pin"></div>
            </div>
          </div>

          <button className="recapture-btn">
            <FiRefreshCw size={16} /> Recapture Location
          </button>
        </div>
      </section>

      <div className="footer-action">
        <button className="primary-button submit-btn">
          Submit Task <FiCheck size={20} />
        </button>
      </div>
    </div>
  );
};

export default SubmitTask;
