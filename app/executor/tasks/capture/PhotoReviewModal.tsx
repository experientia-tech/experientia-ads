"use client";
import React from "react";
import { FiX, FiRotateCcw, FiCheck, FiLoader } from "react-icons/fi";
import "./PhotoReviewModal.scss";

const VIEW_LABELS: Record<string, string> = {
  front: "Front View",
  side: "Side View",
  back: "Back View",
};

interface PhotoReviewModalProps {
  imageUrl: string;
  // "pending": a freshly captured, not-yet-uploaded frame — must Retake or confirm with Use Photo.
  // "view": an already-uploaded photo opened from the thumbnail strip — can be closed or retaken.
  mode: "pending" | "view";
  label?: string | null;
  isSaving?: boolean;
  onRetake: () => void;
  onConfirm?: () => void;
  onClose?: () => void;
}

const PhotoReviewModal: React.FC<PhotoReviewModalProps> = ({
  imageUrl,
  mode,
  label,
  isSaving = false,
  onRetake,
  onConfirm,
  onClose,
}) => {
  const displayLabel = label ? (VIEW_LABELS[label] ?? label) : null;

  return (
    <div className="photo-review-modal">
      <div className="photo-review-header">
        {displayLabel && <span className="photo-review-label">{displayLabel}</span>}
        {mode === "view" && onClose && (
          <button
            className="photo-review-close"
            onClick={onClose}
            type="button"
            title="Close"
          >
            <FiX size={22} />
          </button>
        )}
      </div>

      <div className="photo-review-image-wrap">
        <img
          src={imageUrl}
          alt={displayLabel || "Captured photo"}
          className="photo-review-image"
        />
      </div>

      <div className="photo-review-actions">
        <button
          className="photo-review-btn retake"
          onClick={onRetake}
          disabled={isSaving}
          type="button"
        >
          <FiRotateCcw size={18} />
          <span>{mode === "pending" ? "Retake" : "Retake This Photo"}</span>
        </button>

        {mode === "pending" && onConfirm && (
          <button
            className="photo-review-btn confirm"
            onClick={onConfirm}
            disabled={isSaving}
            type="button"
          >
            {isSaving ? (
              <FiLoader size={18} className="photo-review-spin" />
            ) : (
              <FiCheck size={18} />
            )}
            <span>{isSaving ? "Uploading..." : "Use Photo"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PhotoReviewModal;
