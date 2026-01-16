"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiBell,
  FiMaximize,
  FiSettings,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import "./navbar.scss";

const ExecutorNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="executor-navbar">
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search for tasks, data..." />
      </div>

      <div className="navbar-actions">
        <button className="action-btn">
          <FiMaximize />
        </button>

        <div className="notification-wrapper">
          <button className="action-btn">
            <FiBell />
            <span className="badge">4</span>
          </button>
        </div>

        <div className="profile-wrapper" ref={dropdownRef}>
          <div
            className="profile-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="user-info">
              <span className="user-name">John D.</span>
              <span className="user-status">Online</span>
            </div>
            <div className="avatar">JD</div>
          </div>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <p>Welcome, John!</p>
              </div>
              <ul className="dropdown-list">
                <li>
                  <FiUser /> My Profile
                </li>
                <li>
                  <FiSettings /> Settings
                </li>
                <li className="divider"></li>
                <li className="logout">
                  <FiLogOut /> Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ExecutorNavbar;
