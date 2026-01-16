"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiChevronDown, FiLogOut, FiUser, FiSettings, FiBell } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import './page.scss';

// Dynamically import the CreateCampaignForm component to avoid SSR issues with modals
const CreateCampaignForm = dynamic(
  () => import('../ceate_campaign/CreateCampaignForm'),
  { ssr: false }
);

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Toggle mobile menu
  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    // Toggle body class and scroll
    if (newMenuState) {
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
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
        if (target.closest('.side-menu') || 
            target.closest('.hamburger-menu') ||
            target.closest('a') ||
            target.closest('button')) {
          return;
        }
        
        // Close menu when clicking anywhere else
        setIsMenuOpen(false);
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset body styles when component unmounts
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
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
            <div className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          
          {/* Company Logo and Name - Hidden on mobile */}
          <div className="company-brand">
            <div className="logo">
              <Image 
                src="/experentia.png" 
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
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>

      {/* Campaign Form Modal */}
      {isCampaignFormOpen && (
        <CreateCampaignForm onClose={() => setIsCampaignFormOpen(false)} />
      )}
    </>
  );
};

export default Navbar;