"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiChevronDown, FiLogOut, FiUser, FiSettings, FiBell } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import './page.scss';

// Dynamically import the CreateCampaignForm component to avoid SSR issues with modals
const CreateCampaignForm = dynamic(
  () => import('../campaign/CreateCampaignForm'),
  { ssr: false }
);

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
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
              <div className="profile-image" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer' }}>
                <Image
                  src="/profile-placeholder.png"
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="profile-details">
                  <div className="profile-name">Yashwanth R</div>
                  <div className="profile-phone">7204612595</div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item">
                  <FiUser className="dropdown-icon" />
                  <span>My Profile</span>
                </div>
                <div className="dropdown-item">
                  <FiSettings className="dropdown-icon" />
                  <span>Settings</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout">
                  <FiLogOut className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Form Modal */}
      {isCampaignFormOpen && (
        <CreateCampaignForm onClose={() => setIsCampaignFormOpen(false)} />
      )}
    </nav>
  );
};

export default Navbar;