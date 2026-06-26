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
  FiFileText,
  FiLoader,
} from "react-icons/fi";
import Link from "next/link";
import TaskOverview from "@/app/experientia/components/task_overview/task_overview";
import styles from "./page.module.scss";
import ReportCard from "@/app/experientia/components/report_card/Report_card";
import TaskDetail from "@/app/experientia/components/taskdetail/TaskDetail";
import ReportsMap from "@/app/experientia/components/reports_map/ReportsMap";
import ErrorModal from "@/app/experientia/components/error_modal/ErrorModal";
import logo from "@/public/experientia.png";
import Image from "next/image";

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
    flagged: false,
    searchQuery: "",
    dateRange: { start: "", end: "" },
    executor: "",
    stateBackground: "",
    geofenced: false,
  });

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<false | "excel" | "pdf">(
    false,
  );
  const [showAllMaps, setShowAllMaps] = useState(false);

  const [campaignData, setCampaignData] = useState<any>(null);

  const [tasks, setTasks] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate task overview statistics from real data
  const totalTasks = campaignData?.totalTasks ?? 0;
  const completedTasks = tasks.filter((t) => t.status === "ACCEPTED").length;
  const remainingTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const flaggedTasks = tasks.filter((task) => task.flagged).length;

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
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
            notes: task.notes,
          };
        });
        setTasks(formattedTasks);
      } else {
        // Campaign loaded but has no tasks yet — not an error.
        setCampaignData(data.data || null);
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't load this report's tasks. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchTasks();
    }
  }, [campaignId]);

  // ── Shared download helper ──────────────────────────────────────────────
  const triggerDownload = async (url: string, fallbackFilename: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok)
      throw new Error(`Download failed: ${response.statusText}`);

    const contentDisposition = response.headers.get("content-disposition");
    let filename = fallbackFilename;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  };

  const handleExportToExcel = async () => {
    if (isExporting) return;
    setIsExporting("excel");
    try {
      await triggerDownload(
        `/api/campaigns/${campaignId}/export`,
        "tasks.xlsx",
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setErrorMessage("Failed to export to Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToPdf = async () => {
    if (isExporting) return;
    setIsExporting("pdf");
    try {
      await triggerDownload(
        `/api/campaigns/${campaignId}/export-pdf`,
        "report.pdf",
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setErrorMessage("Failed to generate the PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const executors = [
    { id: "all", name: "All Executors" },
    ...Array.from(
      new Map(tasks.map((t) => [t.executorId, t.executorName])).entries(),
    ).map(([id, name]) => ({ id, name })),
  ];

  const states = [
    { id: "all", name: "All Statuses" },
    { id: "PENDING", name: "Pending" },
    { id: "ACCEPTED", name: "Created" },
  ];

  const filteredTasks = tasks.filter((task) => {
    // 1. Search Query (Task ID)
    if (
      filters.searchQuery &&
      !task.taskId.toLowerCase().includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }
    // 2. Executor Filter
    if (
      filters.executor &&
      filters.executor !== "all" &&
      task.executorId !== filters.executor
    ) {
      return false;
    }
    // 3. Status Filter (stateBackground)
    if (
      filters.stateBackground &&
      filters.stateBackground !== "all" &&
      task.status !== filters.stateBackground
    ) {
      return false;
    }
    // 4. Flagged Filter
    if (filters.flagged && !task.flagged) {
      return false;
    }
    return true;
  });

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

  const currentSelectedTask = selectedTask
    ? tasks.find(
        (t) => t.id === selectedTask.taskId || t.id === selectedTask.id,
      ) || selectedTask
    : null;

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
              src={campaign.logo || logo.src}
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
          {/* <button
            className={styles.exportButton}
            onClick={handleExportToExcel}
            disabled={!!isExporting}
            title="Download as Excel spreadsheet"
          >
            {isExporting === "excel" ? (
              <>
                <FiLoader size={16} className={styles.spinnerIcon} />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <FiDownload size={16} />
                <span>Export to Excel</span>
              </>
            )}
          </button> */}

          <button
            className={styles.pdfButton}
            onClick={handleExportToPdf}
            disabled={!!isExporting}
            title="Download as PDF report"
          >
            {isExporting === "pdf" ? (
              <>
                <FiLoader size={16} className={styles.spinnerIcon} />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <FiFileText size={16} />
                <span>Export to PDF</span>
              </>
            )}
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

            {filters.card && (
              <div className={styles.globalToggle}>
                <span className={styles.globalToggleLabel}>Show All Maps</span>
                <button
                  className={`${styles.globalToggleButton} ${showAllMaps ? styles.active : ""}`}
                  onClick={() => setShowAllMaps(!showAllMaps)}
                  type="button"
                >
                  <div className={styles.globalToggleSlider} />
                </button>
              </div>
            )}
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
        ) : filteredTasks.length === 0 ? (
          <div>No tasks found for this campaign.</div>
        ) : filters.location ? (
          <ReportsMap
            tasks={filteredTasks
              .filter((t) => t.latitude !== null && t.longitude !== null)
              .map((t) => ({
                id: t.id,
                latitude: t.latitude,
                longitude: t.longitude,
                status: t.status,
              }))}
            totalTasks={filteredTasks.length}
            campaignLocation={{
              latitude: campaign.latitude,
              longitude: campaign.longitude,
              name: campaign.name,
              address: campaign.address,
            }}
          />
        ) : (
          filteredTasks.map((task) => (
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
              status={task.status}
              latitude={task.latitude}
              longitude={task.longitude}
              forceShowMap={showAllMaps}
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
                  status: task.status,
                  notes: task.notes,
                })
              }
            />
          ))
        )}
      </div>
      {currentSelectedTask && (
        <TaskDetail
          task={{
            id: currentSelectedTask.taskId || currentSelectedTask.id,
            executorName: currentSelectedTask.executorName,
            executorId: currentSelectedTask.executorId,
            completedOn: `${currentSelectedTask.date} at ${currentSelectedTask.time}`,
            isFlagged: false,
            distance: currentSelectedTask.distance,
            timeFromPrevious: currentSelectedTask.timeLater,
            inGeofence: currentSelectedTask.inGeofence,
            location: currentSelectedTask.location,
            latitude: currentSelectedTask.latitude,
            longitude: currentSelectedTask.longitude,
            metadata: currentSelectedTask.metadata,
            status: currentSelectedTask.status,
            notes: currentSelectedTask.notes,
          }}
          onClose={() => setSelectedTask(null)}
          onStatusUpdate={fetchTasks}
        />
      )}

      <ErrorModal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Something went wrong"
        message={errorMessage || ""}
        buttonText="Dismiss"
      />
    </div>
  );
};

export default ReportContent;
