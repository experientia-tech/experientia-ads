"use client";
import React from "react";
import { FiAlertCircle } from "react-icons/fi";
import "./ErrorModal.scss";

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title = "Error",
    message = "Something went wrong.",
    buttonText = "Close",
}) => {
    if (!isOpen) return null;

    return (
        <div className="error-modal-overlay">
            <div className="error-modal-container">
                <div className="error-icon-wrapper">
                    <div className="error-icon-circle">
                        <FiAlertCircle size={40} className="alert-icon" />
                    </div>
                    <div className="icon-pulse"></div>
                </div>

                <h2 className="error-title">{title}</h2>
                <p className="error-message">{message}</p>

                <button className="error-button" onClick={onClose}>
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default ErrorModal;
