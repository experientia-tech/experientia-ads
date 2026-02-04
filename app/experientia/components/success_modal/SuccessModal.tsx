"use client";
import React from "react";
import { FiCheck } from "react-icons/fi";
import "./SuccessModal.scss";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Your action has been completed successfully.",
  buttonText = "Continue",
}) => {
  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay">
      <div className="success-modal-container">
        <div className="success-icon-wrapper">
          <div className="success-icon-circle">
            <FiCheck size={40} className="check-icon" />
          </div>
          <div className="icon-pulse"></div>
        </div>

        <h2 className="success-title">{title}</h2>
        <p className="success-message">{message}</p>

        <button className="success-button" onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
