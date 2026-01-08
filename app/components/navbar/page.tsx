"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiChevronDown, FiLogOut, FiUser, FiSettings, FiBell } from 'react-icons/fi';
import './page.scss';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

        {/* Profile Section */}
        <div className="profile-section" ref={dropdownRef}>
         {/*  <div className="notifications">
            <FiBell className="notification-icon" />
            <span className="notification-badge">3</span>
          </div> */}
          
          <div 
            className="profile-info"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="profile-image">
              <Image
                src="/profile-placeholder.png"
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full"
              />
            </div>
            <div className="profile-details">
              <span className="profile-name">Yashwanth R</span>
              <span className="profile-phone">7204612595</span>
            </div>
            <FiChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="dropdown-menu">
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
    </nav>
  );
};

export default Navbar;