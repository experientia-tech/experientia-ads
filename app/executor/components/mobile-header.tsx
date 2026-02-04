"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiUser,
  FiPhone,
  FiCheckCircle,
  FiPlusCircle,
  FiLogOut,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/Auth";
import "./mobile-header.scss";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  name?: string;
  phone?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showAvatar = true,
  name = "Alex",
  phone = "+91 9988776655",
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.replace("/executor/login");
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((s) => s[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="mobile-header">
      <div className="header-text">
        <h1 className="title">{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {showAvatar && (
          <div className="profile-section" ref={dropdownRef}>
            <div
              className={`avatar-container ${dropdownOpen ? "active" : ""}`}
              onClick={toggleDropdown}
            >
              <div className="avatar-initials">
                {getInitials(name)}
                <span className="online-indicator"></span>
              </div>
              <FiChevronDown
                className={`chevron ${dropdownOpen ? "rotate" : ""}`}
                size={16}
              />
            </div>

            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <p className="user-name">{name}</p>
                  <p className="user-phone">{phone}</p>
                </div>

               {/*  <div className="dropdown-divider"></div>

                <div className="dropdown-item">
                  <FiCheckCircle size={18} />
                  <span>
                    Completed Campaigns: <strong>0</strong>
                  </span>
                </div>

                <div className="dropdown-item">
                  <FiPlusCircle size={18} />
                  <span>
                    Unassigned Campaigns: <strong>0</strong>
                  </span>
                </div>

                <div className="dropdown-divider"></div>
 */}
                <button
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  <FiLogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
