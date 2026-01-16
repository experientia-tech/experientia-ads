"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiList,
  FiCheckCircle,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiChevronRight,
} from "react-icons/fi";
import "./sidebar.scss";

const ExecutorSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "MAIN",
      items: [
        { name: "Dashboard", path: "/executor/dashboard", icon: <FiGrid /> },
        { name: "Active Tasks", path: "/executor/tasks", icon: <FiList /> },
        {
          name: "Completed",
          path: "/executor/completed",
          icon: <FiCheckCircle />,
        },
      ],
    },
    {
      title: "ANALYSIS",
      items: [
        {
          name: "Performance",
          path: "/executor/performance",
          icon: <FiBarChart2 />,
        },
      ],
    },
    {
      title: "USER",
      items: [
        { name: "Profile", path: "/executor/profile", icon: <FiUser /> },
        { name: "Settings", path: "/executor/settings", icon: <FiSettings /> },
      ],
    },
  ];

  return (
    <aside className="executor-sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">E</div>
        <span className="brand-name">Executor Hub</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.title} className="nav-section">
            <h3 className="section-title">{section.title}</h3>
            <ul className="nav-list">
              {section.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <li
                    key={item.path}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <Link href={item.path} className="nav-link">
                      <span className="icon">{item.icon}</span>
                      <span className="text">{item.name}</span>
                      {isActive && <FiChevronRight className="active-arrow" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-sm-card">
          <div className="avatar">JD</div>
          <div className="info">
            <p className="name">John Doexecutor</p>
            <p className="role">Senior Executor</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ExecutorSidebar;
