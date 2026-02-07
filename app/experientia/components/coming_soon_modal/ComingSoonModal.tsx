"use client";
import React from "react";
import { FiX, FiClock } from "react-icons/fi";
import "./ComingSoonModal.scss";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  title = "Coming Soon",
  message = "We're working hard to bring this feature to you. Stay tuned!",
}) => {
  if (!isOpen) return null;

  return (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div
        className="coming-soon-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="animation-wrapper">
          <div className="floating-icon">
            <FiClock size={48} />
          </div>
        </div>

        <div className="content">
          <h2 className="title">{title}</h2>
          <p className="message">{message}</p>
        </div>

        <div className="button-wrapper">
          <button className="stay-tuned-btn" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
