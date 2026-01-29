"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FiSearch,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiSettings,
  FiBell,
} from "react-icons/fi";
import dynamic from "next/dynamic";
import "./page.scss";
import { useAuthStore } from "@/app/store/Auth";

import LogoImage from "../../../public/logo.jpeg";
const CreateCampaignForm = dynamic(
  () => import("../create_campaign/CreateCampaignForm"),
  { ssr: false },
);

const Navbar = () => {
  const { user } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    if (newMenuState) {
      document.body.classList.add("menu-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "";
    }
  };

  // Handle click outside for dropdown and mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Handle dropdown close
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }

      // Handle mobile menu close
      if (isMenuOpen) {
        // Don't close if clicking inside menu, menu items, or hamburger button
        if (
          target.closest(".side-menu") ||
          target.closest(".hamburger-menu") ||
          target.closest("a") ||
          target.closest("button")
        ) {
          return;
        }

        // Close menu when clicking anywhere else
        setIsMenuOpen(false);
        document.body.classList.remove("menu-open");
        document.body.style.overflow = "";
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset body styles when component unmounts
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Hamburger Menu Button - Mobile Only */}
          <button
            className="hamburger-menu"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className={`hamburger-icon ${isMenuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>

          {/* Company Logo and Name - Hidden on mobile */}
          <div className="company-brand">
            <div className="logo">
              <Image
                src={LogoImage}
                alt="Experientia Logo"
                width={40}
                height={40}
                className="logo-image"
              />
            </div>
            <h1 className="company-name">Experientia</h1>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-icon">
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
            />
          </div>

          <div className="right-section">
            {/* Create Campaign Button */}
            <button
              className="create-campaign-btn"
              onClick={() => setIsCampaignFormOpen(true)}
            >
              + Create Campaign
            </button>

            {/* Profile Section */}
            <div className="profile-section" ref={dropdownRef}>
              <div className="profile-info">
                <div
                  className="profile-avatar"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    cursor: "pointer",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "14px",
                    position: "relative",
                  }}
                >
                  {getInitials()}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      right: "2px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      border: "2px solid white",
                    }}
                  ></span>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="profile-details">
                    <div className="profile-name">
                      {user?.firstName + " " + user?.lastName}
                    </div>
                    <div className="profile-phone">{user?.phone}</div>
                  </div>

                  <button className="dropdown-item logout">
                    <FiLogOut className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      ></div>

      {/* Campaign Form Modal */}
      {isCampaignFormOpen && (
        <CreateCampaignForm onClose={() => setIsCampaignFormOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
