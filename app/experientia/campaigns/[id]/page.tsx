"use client";
import Image from "next/image";
import TaskOverview from "../../components/task_overview/task_overview";
import ErrorModal from "../../components/error_modal/ErrorModal";
import {
  FiEdit2,
  FiAlertCircle,
  FiRefreshCw,
  FiFileText,
  FiArrowLeft,
  FiBriefcase,
  FiUsers,
  FiUserCheck,
  FiPlus,
  FiUserPlus,
} from "react-icons/fi";
import SupervisorModal from "@/app/experientia/components/supervisor_modal/SupervisorModal";
import ExecutorModal from "@/app/experientia/components/executor_modal/ExecutorModal";
import Link from "next/link";
import styles from "./page.module.scss";
import TeamMemberTable from "../../components/team_member_table/TeamMemberTable";
import CreateCampaignForm from "../../create_campaign/CreateCampaignForm";
import ComingSoonModal from "../../components/coming_soon_modal/ComingSoonModal";

import { fetchCampaignById } from "@/app/store/Campaigns";
import { ICampaign } from "@/app/constants/interface";
import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/app/constants/api";
import { formatDate } from "@/app/constants/date";

const CampaignDetailsPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  // Use the 'use' hook to unwrap params Promise in Next.js 15+
  const { id } = use(params);
  const router = useRouter();

  console.log(id, "The Params");

  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [isExecutorModalOpen, setIsExecutorModalOpen] = useState(false);
  const [errorModalConfig, setErrorModalConfig] = useState({
    isOpen: false,
    title: '',
    message: ''
  });
  const [isAddingSupervisor, setIsAddingSupervisor] = useState(false);
  const [isAddingExecutor, setIsAddingExecutor] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchCampaignById(id);
        if (res.success) {
          setCampaign(res.data || null);
        } else {
          throw new Error(res.error || "Failed to fetch campaign");
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleUpdate = () => {
      fetchData();
    };

    window.addEventListener("campaignUpdated", handleUpdate);
    return () => {
      window.removeEventListener("campaignUpdated", handleUpdate);
    };
  }, [id]);

  const handleRefresh = () => {
    setError(null);
    fetchCampaignById(id).then((res) => {
      if (res.success) {
        setCampaign(res.data || null);
      } else {
        setError(res.error || "Failed to refresh data");
      }
    });
  };

  const handleMemberAdded = () => {
    handleRefresh();
    // router.refresh();
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/campaign-members?id=${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }
      handleRefresh();

    } catch (error) {
      console.error("Error removing member:", error);
      setErrorModalConfig({
        isOpen: true,
        title: "Failed to remove member",
        message: error instanceof Error ? error.message : "Failed to remove member"
      });
      throw error;
    }
  };

  const handleErrorClose = () => {
    setErrorModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className={styles.campaignDetailsPage}>
      <div className={styles.header}>
        <button
          onClick={() => router.push('/experientia/dashboard')}
          className={styles.backButton}
        >
          <FiArrowLeft size={20} />
          <span>Back to Campaigns</span>
        </button>
      </div>

      <div className={styles.campaignHeader}>
        <div className={styles.campaignInfo}>
          {/* <div className={styles.logoContainer}>
            <Image
              src={campaign}
              alt={campaign.name}
              width={80}
              height={80}
              className={styles.logo}
            />
          </div> */}
          <div className={styles.campaignText}>
            <h1>{campaign?.name}</h1>
            <div className={styles.serviceBadge}>{campaign?.serviceType}</div>
            <p className={styles.description}>{campaign?.description}</p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.editButton}
            onClick={() => setIsEditModalOpen(true)}
          >
            <FiEdit2 size={16} />
            <span>Edit Campaign</span>
          </button>
          <Link
            href={`/experientia/reports/${campaign?.id}`}
            className={styles.reportButton}
          >
            <FiFileText size={16} />
            <span>View Full Report</span>
          </Link>
        </div>
      </div>
      <TaskOverview
        totalTasks={campaign?.totalTasks ?? 0}
        completedTasks={campaign?.tasks?.length ?? 0}
        remainingTasks={
          (campaign?.totalTasks ?? 0) - (campaign?.tasks?.length ?? 0)
        }
        progress={
          campaign?.totalTasks
            ? ((campaign?.tasks?.length ?? 0) / campaign.totalTasks) * 100
            : 0
        }
      // flaggedTasks={campaign?.flaggedTasks || 0}
      />

      <div className={styles.campaignInfoSection}>
        <h2>Campaign Information</h2>
        <div className={styles.infoGrid}>
          {/*  <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Role</span>
            <span className={styles.infoValue}>Campaign Manager</span>
          </div> */}
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Created</span>
            <span className={styles.infoValue}>
              {formatDate(campaign?.createdAt)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Started</span>
            <span className={styles.infoValue}>
              {formatDate(campaign?.startDate)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>End Date</span>
            <span className={styles.infoValue}>
              {formatDate(campaign?.endDate)}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.teamOverview}>
        <h2>Team & Partners</h2>
        <div className={styles.teamGrid}>
          <div className={styles.teamCard}>
            <div className={styles.teamContent}>
              <div className={styles.teamIcon}>
                <FiBriefcase size={24} />
              </div>
              <div className={styles.teamInfo}>
                {/*  <span className={styles.teamCount}>
                  {campaign?.brands?.length || 0}
                </span> */}
                <span className={styles.teamLabel}>Brands</span>
              </div>
            </div>
            <button
              className={styles.addButton}
              onClick={() => setIsComingSoonModalOpen(true)}
            >
              <FiPlus size={20} />
            </button>
          </div>

          <div className={styles.teamCard}>
            <div className={styles.teamContent}>
              <div className={styles.teamIcon}>
                <FiUsers size={24} />
              </div>
              <div className={styles.teamInfo}>
                {/*  <span className={styles.teamCount}>
                  {campaign?.agencies?.length || 0}
                </span> */}
                <span className={styles.teamLabel}>Agencies</span>
              </div>
            </div>
            <button
              className={styles.addButton}
              onClick={() => setIsComingSoonModalOpen(true)}
            >
              <FiPlus size={20} />
            </button>
          </div>

          <div className={styles.teamCard}>
            <div className={styles.teamContent}>
              <div className={styles.teamIcon}>
                <FiUserCheck size={24} />
              </div>
              <div className={styles.teamInfo}>
                <span className={styles.teamCount}>
                  {campaign?.members?.filter((m) => m.role === "SUPERVISOR")
                    .length || 0}
                </span>
                <span className={styles.teamLabel}>Supervisors</span>
              </div>
            </div>
            <button
              className={styles.addButton}
              onClick={() => setIsSupervisorModalOpen(true)}
            >
              <FiPlus size={20} />
            </button>
          </div>

          <div className={styles.teamCard}>
            <div className={styles.teamContent}>
              <div className={styles.teamIcon}>
                <FiUserPlus size={24} />
              </div>
              <div className={styles.teamInfo}>
                <span className={styles.teamCount}>
                  {campaign?.members?.filter((m) => m.role === "EXECUTOR")
                    .length || 0}
                </span>
                <span className={styles.teamLabel}>Executors</span>
              </div>
            </div>
            <button
              className={styles.addButton}
              onClick={() => setIsExecutorModalOpen(true)}
            >
              <FiPlus size={20} />
            </button>
          </div>
        </div>
        <div className={styles.teamMemberSection}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading team members...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <FiAlertCircle size={24} />
              <p>{error}</p>
              <button onClick={handleRefresh} className={styles.retryButton}>
                <FiRefreshCw size={16} /> Retry
              </button>
            </div>
          ) : (
            <TeamMemberTable
              members={(campaign?.members || []).map((member) => ({
                id: member.id,
                name:
                  `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim() ||
                  "Unnamed User",
                contactNumber: member.user?.phone || "N/A",
                role: member.role,
                location: member.location || campaign?.name || "N/A",
                assignedBy: member.assignedByName || "Unknown",
                status: member.active ? "active" : "inactive",
              }))}
              onDelete={handleDeleteMember}
            />
          )}
        </div>
      </div>

      <SupervisorModal
        isOpen={isSupervisorModalOpen}
        campaignId={id}
        organizationId={campaign?.organizationId || ''}
        onClose={() => !isAddingSupervisor && setIsSupervisorModalOpen(false)}
        onAddSuccess={handleMemberAdded}
        onSelect={async (supervisor) => {
          if (isAddingSupervisor) return;

          try {
            setIsAddingSupervisor(true);
            const addResponse = await authenticatedFetch(
              "/api/campaign-members",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  campaignId: id,
                  userId: supervisor.id,
                  role: "SUPERVISOR",
                }),
              },
            );

            if (!addResponse.ok) {
              const errorData = await addResponse.json();
              throw new Error(errorData.message || "Failed to add supervisor");
            }
            setIsSupervisorModalOpen(false);
            const updatedResponse = await fetchCampaignById(id);
            if (updatedResponse.success && updatedResponse.data) {
              setCampaign(updatedResponse.data);
            }

            console.log("Successfully added supervisor");
            router.refresh();
          } catch (error) {
            console.error("Error adding supervisor:", error);
            setErrorModalConfig({
              isOpen: true,
              title: "Failed to add supervisor",
              message: error instanceof Error ? error.message : "Failed to add supervisor"
            });
          } finally {
            setIsAddingSupervisor(false);
          }
        }}
        existingSupervisors={campaign?.members?.map((m) => m.userId) || []}
        isLoading={isAddingSupervisor}
      />

      <ExecutorModal
        isOpen={isExecutorModalOpen}
        campaignId={id}
        organizationId={campaign?.organizationId || ''}
        onClose={() => !isAddingExecutor && setIsExecutorModalOpen(false)}
        onAddSuccess={handleMemberAdded}
        onSelect={async (executor) => {
          if (isAddingExecutor) return;

          try {
            setIsAddingExecutor(true);
            const addResponse = await authenticatedFetch(
              "/api/campaign-members",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  campaignId: id,
                  userId: executor.id,
                  role: "EXECUTOR",
                }),
              },
            );

            if (!addResponse.ok) {
              const errorData = await addResponse.json();
              throw new Error(errorData.message || "Failed to add executor");
            }
            setIsExecutorModalOpen(false);
            const updatedResponse = await fetchCampaignById(id);
            if (updatedResponse.success && updatedResponse.data) {
              setCampaign(updatedResponse.data);
            }

            console.log("Successfully added executor");
            router.refresh();
          } catch (error) {
            console.error("Error adding executor:", error);
            setErrorModalConfig({
              isOpen: true,
              title: "Failed to add executor",
              message: error instanceof Error ? error.message : "Failed to add executor"
            });
          } finally {
            setIsAddingExecutor(false);
          }
        }}
        existingExecutors={campaign?.members?.map((m) => m.userId) || []}
        isLoading={isAddingExecutor}
      />

      {isEditModalOpen && (
        <CreateCampaignForm
          onClose={() => setIsEditModalOpen(false)}
          isEdit={true}
          initialData={campaign}
        />
      )}
      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
      />

      <ErrorModal
        isOpen={errorModalConfig.isOpen}
        onClose={handleErrorClose}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        buttonText="Close"
      />
    </div>
  );
};

export default CampaignDetailsPage;
