"use client";
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import "./ConfirmDialog.scss";

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    isConfirming = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog-container" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon-wrapper">
                    <div className="confirm-icon-circle">
                        <FiAlertTriangle size={36} className="confirm-alert-icon" />
                    </div>
                </div>

                <h2 className="confirm-title">{title}</h2>
                <p className="confirm-message">{message}</p>

                <div className="confirm-actions">
                    <button
                        className="confirm-cancel-button"
                        onClick={onCancel}
                        disabled={isConfirming}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        className="confirm-delete-button"
                        onClick={onConfirm}
                        disabled={isConfirming}
                        type="button"
                    >
                        {isConfirming ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
