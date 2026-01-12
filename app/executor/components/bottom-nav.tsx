"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiMap, FiList, FiUser } from "react-icons/fi";
import "./bottom-nav.scss";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/executor/dashboard", icon: <FiHome /> },
    { name: "Map", path: "/executor/map", icon: <FiMap /> },
    { name: "Tasks", path: "/executor/tasks", icon: <FiList /> },
    { name: "Profile", path: "/executor/profile", icon: <FiUser /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
