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
  FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import "./page.scss";
import { useAuthStore } from "@/app/store/Auth";
//@ts-ignore
import logo from "@/public/experientia.png";
import { useCampaignStore } from "@/app/store/Campaigns";
import { ICampaign } from "@/app/constants/interface";
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

  const [searchedCampaigns, setSearchedCampaigns] = useState<
    ICampaign[] | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { searchCampaign } = useCampaignStore();

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

      // Handle search results close
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchedCampaigns(null);
        setIsSearching(false);
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

  const handleSearchInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const query = e.target.value;
    if (query.trim().length > 0) {
      setIsSearching(true);
      const response = await searchCampaign(query);
      setSearchedCampaigns(response.data || []);
    } else {
      setIsSearching(false);
      setSearchedCampaigns(null);
    }
  };

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
                src={logo}
                alt="Experientia Logo"
                width={40}
                height={40}
                className="logo-image"
              />
            </div>
            <h1 className="company-name">Experientia</h1>
          </div>

          {/* Search Bar */}
          <div className="search-container" ref={searchRef}>
            <div className="search-icon">
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Search for campaigns..."
              className="search-input"
              onChange={handleSearchInputChange}
            />

            {/* Search Results Modal */}
            {isSearching && searchedCampaigns !== null && (
              <div className="search-results-modal">
                {searchedCampaigns.length > 0 ? (
                  <div className="results-list">
                    {searchedCampaigns.map((campaign) => (
                      <Link
                        key={campaign.id}
                        href={`/experientia/campaigns/${campaign.id}`}
                        className="result-item"
                        onClick={() => {
                          setIsSearching(false);
                          setSearchedCampaigns(null);
                        }}
                      >
                        <span className="campaign-name">{campaign.name}</span>
                        <FiArrowRight className="arrow-icon" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">No results found</div>
                )}
              </div>
            )}
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
