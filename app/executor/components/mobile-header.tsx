"use client";
import React from "react";
import { FiMenu } from "react-icons/fi";
import Image from "next/image";
import "./mobile-header.scss";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showAvatar = true,
}) => {
  return (
    <header className="mobile-header">
      <div className="header-text">
        <h1 className="title">{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {showAvatar && (
          <div className="avatar-wrapper">
            <div className="avatar">
              <Image
                src="/profile-placeholder.png"
                alt="Profile"
                width={40}
                height={40}
              />
              <span className="online-indicator"></span>
            </div>
          </div>
        )}
        <button className="menu-btn">
          <FiMenu size={28} />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
