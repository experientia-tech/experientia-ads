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
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const [filters, setFilters] = useState({
    card: true,
    location: false,
    // flagged: false,
    searchQuery: "",
    dateRange: { start: "", end: "" },
    executor: "",
    stateBackground: "",
    geofenced: false,
  });

  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [campaignData, setCampaignData] = useState<any>(null);

  const [tasks, setTasks] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Calculate task overview statistics from real data
  const totalTasks = campaignData?.totalTasks ?? 0;
  const completedTasks = tasks.length;
  const remainingTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const flaggedTasks = tasks.filter((task) => task.flagged).length;

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
          // Set campaign data for task overview
          setCampaignData(data.data);

          // Sort tasks by creation date to calculate time differences correctly
          const sortedTasks = data.data.tasks.sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          // Format the tasks for ReportCard component
          const formattedTasks = sortedTasks.map((task: any, index: number) => {
            const metadata = (task.metadata as any) || {};
            const location = metadata.location || {};

            let distance = "Unknown";
            if (index > 0) {
              const previousTask = sortedTasks[index - 1];
              const previousMetadata = (previousTask.metadata as any) || {};
              const previousLocation = previousMetadata.location || {};

              if (
                location.latitude &&
                location.longitude &&
                previousLocation.latitude &&
                previousLocation.longitude
              ) {
                const distanceInMeters = calculateDistance(
                  location.latitude,
                  location.longitude,
                  previousLocation.latitude,
                  previousLocation.longitude,
                );
                distance =
                  distanceInMeters >= 1000
                    ? `${(distanceInMeters / 1000).toFixed(1)}km`
                    : `${Math.round(distanceInMeters)}m`;
              }
            } else {
              // For first task, show GPS accuracy
              if (location.accuracy) {
                distance = `${Math.round(parseFloat(location.accuracy))}m`;
              } else {
                distance = "Unknown";
              }
            }
            let timeLater = "0s";
            if (index > 0) {
              const previousTask = sortedTasks[index - 1];
              const currentTime = new Date(task.createdAt).getTime();
              const previousTime = new Date(previousTask.createdAt).getTime();
              const timeDiffMs = currentTime - previousTime;

              if (timeDiffMs < 60000) {
                timeLater = `${Math.round(timeDiffMs / 1000)}s`;
              } else if (timeDiffMs < 3600000) {
                timeLater = `${Math.round(timeDiffMs / 60000)}m`;
              } else {
                timeLater = `${Math.round(timeDiffMs / 3600000)}h`;
              }
            }

            return {
              id: task.id,
              taskId: task.id,
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
              latitude: location.latitude,
              longitude: location.longitude,
              inGeofence: location.accuracy
                ? parseFloat(location.accuracy) <= 100
                : true,
              distance: distance,
              timeLater: timeLater,
              executorName: task.executor
                ? `${task.executor.firstName} ${task.executor.lastName}`
                : "Unknown Executor",
              executorId: task.executor?.id || "unknown",
              status: task.status,
              flagged: task.flagged,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
              metadata: task.metadata,
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
  }, [campaignId]);

  const handleExportToExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/campaigns/${campaignId}/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export tasks");
      }

      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'tasks.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert the response to blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      // You could show a toast or alert here
    }
  };

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

  const handleFilterChange = (
    filterName: string,
    value: any,
    otherFilter?: string,
    otherValue?: any,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
      ...(otherFilter ? { [otherFilter]: otherValue } : {}),
    }));
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
          <button className={styles.exportButton} onClick={handleExportToExcel}>
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
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          remainingTasks={remainingTasks}
          progress={progress}
        />

        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <FiFilter size={16} /> Filter by:
            </span>
            <button
              className={`${styles.filterButton} ${filters.card ? styles.active : ""}`}
              onClick={() =>
                handleFilterChange("card", true, "location", false)
              }
            >
              Card
            </button>
            <button
              className={`${styles.filterButton} ${filters.location ? styles.active : ""}`}
              onClick={() =>
                handleFilterChange("location", true, "card", false)
              }
            >
              <FiMapPin size={16} /> Location
            </button>
            {/* <button
              className={`${styles.filterButton} ${filters.flagged ? styles.active : ""}`}
              onClick={() => handleFilterChange("flagged", !filters.flagged)}
            >
              <FiFlag size={16} /> Flagged
            </button> */}
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
                latitude: t.latitude,
                longitude: t.longitude,
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
                  executorId: task.executorId,
                  date: task.date,
                  time: task.time,
                  location: task.location,
                  inGeofence: task.inGeofence,
                  distance: task.distance,
                  timeLater: task.timeLater,
                  latitude: task.latitude,
                  longitude: task.longitude,
                  metadata: task.metadata,
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
            executorId: selectedTask.executorId,
            completedOn: `${selectedTask.date} at ${selectedTask.time}`,
            isFlagged: false,
            distance: selectedTask.distance,
            timeFromPrevious: selectedTask.timeLater,
            inGeofence: selectedTask.inGeofence,
            location: selectedTask.location,
            latitude: selectedTask.latitude,
            longitude: selectedTask.longitude,
            metadata: selectedTask.metadata,
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ReportContent;
