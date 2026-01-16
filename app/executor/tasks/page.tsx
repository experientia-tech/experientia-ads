"use client";
import React from "react";
import { FiFilter, FiSearch, FiMoreVertical } from "react-icons/fi";

const TasksPage = () => {
  const tasks = [
    {
      id: 1,
      title: "Write Technical Documentation",
      category: "Writing",
      priority: "High",
      status: "In Progress",
      deadline: "Jan 15",
    },
    {
      id: 2,
      title: "Bug Fix: Profile Image Upload",
      category: "Development",
      priority: "Urgent",
      status: "Pending",
      deadline: "Today",
    },
    {
      id: 3,
      title: "Review Marketing Copy",
      category: "Review",
      priority: "Medium",
      status: "Completed",
      deadline: "Jan 10",
    },
    {
      id: 4,
      title: "Database Migration Script",
      category: "DevOps",
      priority: "High",
      status: "In Progress",
      deadline: "Jan 20",
    },
    {
      id: 5,
      title: "UI Enhancement for Dashboard",
      category: "Design",
      priority: "Medium",
      status: "Pending",
      deadline: "Jan 25",
    },
  ];

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Active Tasks</h1>
          <p>Manage and track your ongoing assignments.</p>
        </div>
        <button className="primary-btn">Create New Task</button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <FiSearch />
          <input type="text" placeholder="Search tasks..." />
        </div>
        <div className="filters">
          <button className="filter-btn">
            <FiFilter /> Filter
          </button>
          <select className="sort-select">
            <option>Recently Added</option>
            <option>Priority: High to Low</option>
            <option>Deadline: Soonest</option>
          </select>
        </div>
      </div>

      <div className="tasks-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deadline</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="task-cell">
                    <span className="task-title">{task.title}</span>
                    <span className="task-id">
                      #TSK-{task.id.toString().padStart(3, "0")}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="category-tag">{task.category}</span>
                </td>
                <td>
                  <span
                    className={`priority-indicator ${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-pill ${task.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td>
                  <span className="deadline">{task.deadline}</span>
                </td>
                <td>
                  <button className="icon-btn">
                    <FiMoreVertical />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .tasks-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        .page-header p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }
        .primary-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          width: 300px;
        }
        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
        }
        .filters {
          display: flex;
          gap: 12px;
        }
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        .sort-select {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .tasks-container {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .tasks-table th {
          padding: 16px 24px;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }
        .tasks-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .tasks-table tr:last-child td {
          border-bottom: none;
        }

        .task-cell {
          display: flex;
          flex-direction: column;
        }
        .task-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .task-id {
          font-size: 12px;
          color: #94a3b8;
        }

        .category-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .priority-indicator {
          font-size: 12px;
          font-weight: 600;
        }
        .priority-indicator.urgent {
          color: #ef4444;
        }
        .priority-indicator.high {
          color: #f97316;
        }
        .priority-indicator.medium {
          color: #eab308;
        }
        .priority-indicator.low {
          color: #64748b;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-pill.in-progress {
          background: #eff6ff;
          color: #3b82f6;
        }
        .status-pill.completed {
          background: #ecfdf5;
          color: #10b981;
        }
        .status-pill.pending {
          background: #fffbeb;
          color: #f59e0b;
        }

        .deadline {
          font-size: 14px;
          color: #475569;
        }
        .icon-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
