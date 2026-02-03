"use client";

import { useState, useEffect } from "react";
import {
  FiDownload,
  FiMail,
  FiChevronLeft,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiFlag,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import Link from "next/link";
import TaskOverview from "@/app/experientia/components/task_overview/task_overview";
import styles from "./page.module.scss";
import ReportCard from "@/app/experientia/components/report_card/Report_card";
import TaskDetail from "@/app/experientia/components/taskdetail/TaskDetail";
import ReportsMap from "@/app/experientia/components/reports_map/ReportsMap";

const ReportContent = ({
  campaignId,
  campaign,
}: {
  campaignId: string;
  campaign: any;
}) => {
  interface ReportFilters {
    card: boolean;
    location: boolean;
    flagged: boolean;
    searchQuery: string;
    dateRange: { start: string; end: string };
    executor: string;
    stateBackground: string;
    geofenced: boolean;
  }

  const [filters, setFilters] = useState<ReportFilters>({
    card: false,
    location: false,
    flagged: false,
    searchQuery: "",
    dateRange: { start: "", end: "" },
    executor: "",
    stateBackground: "",
    geofenced: false,
  });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch campaign");
        }

        const data = await response.json();
        console.log("API Response:", data);
        if (data.success && data.data && data.data.tasks) {
          // Format the tasks for ReportCard component
          const formattedTasks = data.data.tasks.map((task: any) => {
            const metadata = (task.metadata as any) || {};
            const location = metadata.location || {};

            return {
              id: task.id,
              taskId: task.id,
              productName: campaign.name || "Campaign Task",
              productImage:
                metadata.images?.[0]?.url || "/path/to/product-image.jpg",
              date: task.createdAt
                ? new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown",
              time: task.createdAt
                ? new Date(task.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Unknown",
              location:
                location.address || campaign.address || "Unknown Location",
              inGeofence: location.accuracy
                ? parseFloat(location.accuracy) <= 100
                : true,
              distance: location.accuracy
                ? `${Math.round(parseFloat(location.accuracy))}m`
                : "Unknown",
              timeLater: "0s",
              executorName: task.executor
                ? `${task.executor.firstName} ${task.executor.lastName}`
                : "Unknown Executor",
              status: task.status,
              flagged: task.flagged,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
              metadata: task.metadata,
              latitude: location.lat ? parseFloat(location.lat) : null,
              longitude: location.lng ? parseFloat(location.lng) : null,
            };
          });
          setTasks(formattedTasks);
        } else {
          console.error("API Error:", data.message);
          setTasks([]);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchTasks();
    }
  }, [campaignId, campaign]);

  const executors = [
    { id: "all", name: "All Executors" },
    { id: "exec1", name: "John Doe" },
    { id: "exec2", name: "Jane Smith" },
    { id: "exec3", name: "Mike Johnson" },
  ];

  const states = [
    { id: "all", name: "All States" },
    { id: "completed", name: "Completed" },
    { id: "in_progress", name: "In Progress" },
    { id: "not_started", name: "Not Started" },
  ];

  console.log(tasks, "The tasks in first page");

  const handleFilterChange = (filterName: keyof ReportFilters, value: any) => {
    setFilters((prev) => {
      const exclusiveFilters: (keyof ReportFilters)[] = [
        "card",
        "location",
        "flagged",
      ];

      if (exclusiveFilters.includes(filterName)) {
        // If we are toggling on an exclusive filter, turn off others
        if (value === true) {
          return {
            ...prev,
            card: filterName === "card",
            location: filterName === "location",
            flagged: filterName === "flagged",
          };
        }
      }

      return {
        ...prev,
        [filterName]: value,
      };
    });
  };

  return (
    <div className={styles.reportPage}>
      <div className={styles.header}>
        <Link
          href={`/experientia/campaigns/${campaignId}`}
          className={styles.backButton}
        >
          <FiChevronLeft size={20} />
          <span>Back to Campaign</span>
        </Link>
      </div>

      <div className={styles.reportHeader}>
        <div className={styles.brandInfo}>
          <div className={styles.logoContainer}>
            <img
              src={campaign.logo}
              alt={campaign.name}
              className={styles.logo}
            />
          </div>
          <div className={styles.brandText}>
            <h2 className={styles.companyName}>{campaign.name}</h2>
            <div className={styles.serviceBadge}>{campaign.serviceType}</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportButton}>
            <FiDownload size={16} />
            <span>Export to Excel</span>
          </button>
          <button className={styles.emailButton}>
            <FiMail size={16} />
            <span>Email Report</span>
          </button>
        </div>
      </div>

      <div className={styles.reportContent}>
        <TaskOverview
          totalTasks={12}
          completedTasks={8}
          remainingTasks={4}
          progress={67}
          flaggedTasks={2}
        />

        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <FiFilter size={16} /> Filter by:
            </span>
            <button
              className={`${styles.filterButton} ${filters.card ? styles.active : ""}`}
              onClick={() => handleFilterChange("card", !filters.card)}
            >
              Card
            </button>
            <button
              className={`${styles.filterButton} ${filters.location ? styles.active : ""}`}
              onClick={() => handleFilterChange("location", !filters.location)}
            >
              <FiMapPin size={16} /> Location
            </button>
            <button
              className={`${styles.filterButton} ${filters.flagged ? styles.active : ""}`}
              onClick={() => handleFilterChange("flagged", !filters.flagged)}
            >
              <FiFlag size={16} /> Flagged
            </button>
          </div>

          <div className={styles.searchGroup}>
            <div className={styles.searchBar}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by Task ID"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
                className={styles.searchInput}
              />
            </div>

            <div className={styles.dateRange}>
              <FiCalendar className={styles.inputIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={filters.dateRange.start}
                onChange={(e) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    start: e.target.value,
                  })
                }
              />
              <span>to</span>
              <input
                type="date"
                className={styles.dateInput}
                value={filters.dateRange.end}
                onChange={(e) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    end: e.target.value,
                  })
                }
              />
            </div>

            <select
              className={styles.selectInput}
              value={filters.executor}
              onChange={(e) => handleFilterChange("executor", e.target.value)}
            >
              {executors.map((executor) => (
                <option key={executor.id} value={executor.id}>
                  {executor.name}
                </option>
              ))}
            </select>

            <select
              className={styles.selectInput}
              value={filters.stateBackground}
              onChange={(e) =>
                handleFilterChange("stateBackground", e.target.value)
              }
            >
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <div className={styles.geofenceToggle}>
              <span>Geofenced Only</span>
              <button
                className={styles.toggleButton}
                onClick={() =>
                  handleFilterChange("geofenced", !filters.geofenced)
                }
              >
                {filters.geofenced ? (
                  <FiToggleRight size={24} color="#4CAF50" />
                ) : (
                  <FiToggleLeft size={24} color="#ccc" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className={
          filters.location ? styles.reportMapContainer : styles.reportGrid
        }
      >
        {loading ? (
          <div>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div>No tasks found for this campaign.</div>
        ) : filters.location ? (
          <ReportsMap
            tasks={tasks
              .filter((t) => t.latitude !== null && t.longitude !== null)
              .map((t) => ({
                id: t.id,
                lat: t.latitude,
                lng: t.longitude,
                status: t.status,
              }))}
            totalTasks={tasks.length}
          />
        ) : (
          tasks.map((task) => (
            <ReportCard
              key={task.id}
              productName={task.productName}
              productImage={task.productImage}
              taskId={task.taskId}
              date={task.date}
              time={task.time}
              location={task.location}
              inGeofence={task.inGeofence}
              distance={task.distance}
              timeLater={task.timeLater}
              executorName={task.executorName}
              onClick={() =>
                setSelectedTask({
                  taskId: task.taskId,
                  executorName: task.executorName,
                  date: task.date,
                  time: task.time,
                  location: task.location,
                  inGeofence: task.inGeofence,
                  distance: task.distance,
                  timeLater: task.timeLater,
                })
              }
            />
          ))
        )}
      </div>
      {selectedTask && (
        <TaskDetail
          task={{
            id: selectedTask.taskId,
            executorName: selectedTask.executorName,
            completedOn: `${selectedTask.date} at ${selectedTask.time}`,
            isFlagged: false, // You might want to add this to your data
            distance: selectedTask.distance,
            timeFromPrevious: selectedTask.timeLater,
            inGeofence: selectedTask.inGeofence,
            location: selectedTask.location,
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ReportContent;
