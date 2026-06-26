"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./page.module.scss";
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiPhone,
  FiMail,
  FiUser,
  FiPlus,
} from "react-icons/fi";
import { useCampaignStore } from "@/app/store/Campaigns";
import { authenticatedFetch } from "@/app/constants/api";
import SupervisorModal from "@/app/experientia/components/supervisor_modal/SupervisorModal";
import ExecutorModal from "@/app/experientia/components/executor_modal/ExecutorModal";
import BrandModal from "@/app/experientia/components/brand_modal/BrandModal";

const TeamManagementPage = () => {
  const [activeTab, setActiveTab] = useState<"campaigns" | "users" | "brands">(
    "campaigns",
  );

  // Campaigns Pagination State
  const [campaignPage, setCampaignPage] = useState(1);
  const campaignLimit = 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { campaigns, fetchMyCampaigns, pagination } = useCampaignStore();

  // Users Directory Pagination State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Brands Pagination State
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [brandPage, setBrandPage] = useState(1);
  const [brandTotalPages, setBrandTotalPages] = useState(1);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);

  // States for adding supervisor / executor / brand
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [isExecutorModalOpen, setIsExecutorModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAddingSupervisor, setIsAddingSupervisor] = useState(false);
  const [isAddingExecutor, setIsAddingExecutor] = useState(false);

  // Fetch Campaigns
  useEffect(() => {
    fetchMyCampaigns(campaignPage, campaignLimit);
  }, [fetchMyCampaigns, campaignPage]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true);
      const res = await authenticatedFetch(
        `/api/users?page=${userPage}&limit=10&search=${userSearchQuery}`,
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      if (data.success && data.data) {
        setUsersList(data.data.users || []);
        setUserTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [userPage, userSearchQuery]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Fetch Brands
  const fetchBrands = useCallback(async () => {
    try {
      setIsBrandsLoading(true);
      const res = await authenticatedFetch(
        `/api/brands?page=${brandPage}&limit=10&search=${brandSearchQuery}`,
      );
      if (!res.ok) throw new Error("Failed to fetch brands");
      const data = await res.json();
      if (data.success && data.data) {
        setBrandsList(data.data.brands || []);
        setBrandTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setIsBrandsLoading(false);
    }
  }, [brandPage, brandSearchQuery]);

  useEffect(() => {
    if (activeTab === "brands") {
      fetchBrands();
    }
  }, [activeTab, fetchBrands]);

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign?.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedCampaign = campaigns.find(
    (c) => c.id.toString() === selectedCampaignId,
  );

  const handleSupervisorSelect = async (supervisor: any) => {
    if (isAddingSupervisor || !selectedCampaignId) return;

    try {
      setIsAddingSupervisor(true);
      const addResponse = await authenticatedFetch("/api/campaign-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          userId: supervisor.id,
          role: "SUPERVISOR",
        }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.message || "Failed to add supervisor");
      }
      setIsSupervisorModalOpen(false);
      await fetchMyCampaigns(campaignPage, campaignLimit);
      alert("Successfully added supervisor!");
    } catch (error) {
      console.error("Error adding supervisor:", error);
      alert(
        error instanceof Error ? error.message : "Failed to add supervisor",
      );
    } finally {
      setIsAddingSupervisor(false);
    }
  };

  const handleExecutorSelect = async (executor: any) => {
    if (isAddingExecutor || !selectedCampaignId) return;

    try {
      setIsAddingExecutor(true);
      const addResponse = await authenticatedFetch("/api/campaign-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          userId: executor.id,
          role: "EXECUTOR",
        }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.message || "Failed to add executor");
      }
      setIsExecutorModalOpen(false);
      await fetchMyCampaigns(campaignPage, campaignLimit);
      alert("Successfully added executor!");
    } catch (error) {
      console.error("Error adding executor:", error);
      alert(error instanceof Error ? error.message : "Failed to add executor");
    } finally {
      setIsAddingExecutor(false);
    }
  };

  return (
    <div className={styles.teamPage}>
      <div className={styles.header}>
        <div>
          <h1>Team Management</h1>
          <p className={styles.subtitle}>All Campaigns & Teams</p>
        </div>

        {/* Add Supervisor / Executor / Brand Controls on Top */}
        <div className={styles.quickAddSection}>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className={styles.campaignSelect}
          >
            <option value="">Select campaign to manage team...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            disabled={!selectedCampaignId}
            onClick={() => setIsSupervisorModalOpen(true)}
            className={`${styles.addBtn} ${styles.supervisorBtn}`}
            title={
              !selectedCampaignId
                ? "Please select a campaign first"
                : "Add Supervisor"
            }
          >
            <FiPlus size={16} />
            <span>Add Supervisor</span>
          </button>
          <button
            disabled={!selectedCampaignId}
            onClick={() => setIsExecutorModalOpen(true)}
            className={`${styles.addBtn} ${styles.executorBtn}`}
            title={
              !selectedCampaignId
                ? "Please select a campaign first"
                : "Add Executor"
            }
          >
            <FiPlus size={16} />
            <span>Add Executor</span>
          </button>
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className={`${styles.addBtn} ${styles.brandBtn}`}
            title="Add Brand"
          >
            <FiPlus size={16} />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "campaigns" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("campaigns")}
        >
          Campaign Teams
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "users" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("users")}
        >
          All Users Directory
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "brands" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("brands")}
        >
          Brands
        </button>
      </div>

      {activeTab === "campaigns" && (
        <>
          <div className={styles.controls}>
            <div className={styles.searchBar}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <select
                  id="roleFilter"
                  className={styles.filterSelect}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="Content Creator">Content Creator</option>
                  <option value="Designer">Designer</option>
                  <option value="Developer">Developer</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom}></span>
                Show Active Only
              </label>
            </div>
          </div>

          <div className={styles.campaignsList}>
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className={styles.campaignCard}>
                <div
                  className={styles.campaignHeader}
                  onClick={() => toggleCampaign(campaign.id?.toString() || "")}
                >
                  <div className={styles.campaignInfo}>
                    <h3>{campaign.name}</h3>
                    <div className={styles.stats}>
                      <span className={styles.statItem}>
                        <FiUser className={styles.statIcon} />
                        {campaign.members?.length || 0} Members
                      </span>
                      <span className={`${styles.statItem} ${styles.active}`}>
                        <FiMail className={styles.statIcon} />
                        {campaign.members?.filter((m) => m.active).length ||
                          0}{" "}
                        Active
                      </span>
                    </div>
                  </div>
                  <div className={styles.chevron}>
                    {expandedCampaign === campaign.id ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </div>
                </div>

                {expandedCampaign === campaign.id && (
                  <div className={styles.tableContainer}>
                    <table className={styles.membersTable}>
                      <thead>
                        <tr className={styles.tableHeaderRow}>
                          <th className={styles.tableHeaderCell}>Name</th>
                          <th className={styles.tableHeaderCell}>Phone</th>
                          <th className={styles.tableHeaderCell}>Role</th>
                          <th className={styles.tableHeaderCell}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaign.members?.map((member) => (
                          <tr key={member.id} className={styles.tableRow}>
                            <td className={styles.tableCell}>
                              <div className={styles.memberCell}>
                                <FiUser className={styles.userIcon} />
                                {member.user?.firstName} {member.user?.lastName}
                              </div>
                            </td>
                            <td className={styles.tableCell}>
                              {member.user?.phone && (
                                <a
                                  href={`tel:${member.user.phone}`}
                                  className={styles.phoneLink}
                                >
                                  <FiPhone className={styles.icon} />
                                  {member.user.phone}
                                </a>
                              )}
                            </td>
                            <td className={styles.tableCell}>{member.role}</td>
                            <td className={styles.tableCell}>
                              <span
                                className={`${styles.status} ${member.active ? styles.active : ""}`}
                              >
                                {member.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!campaign.members || campaign.members.length === 0) && (
                      <div className={styles.noMembers}>
                        No team members found for this campaign.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Campaign Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className={styles.paginationControls}>
              <button
                disabled={campaignPage <= 1}
                onClick={() => setCampaignPage((prev) => prev - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {campaignPage} of {pagination.totalPages}
              </span>
              <button
                disabled={campaignPage >= pagination.totalPages}
                onClick={() => setCampaignPage((prev) => prev + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Users Directory Tab */}
      {activeTab === "users" && (
        <div className={styles.usersSection}>
          <div className={styles.controls}>
            <div className={styles.searchBar}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search users by name or phone..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setUserPage(1);
                }}
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.membersTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>Name</th>
                  <th className={styles.tableHeaderCell}>Phone</th>
                  <th className={styles.tableHeaderCell}>Role(s)</th>
                  <th className={styles.tableHeaderCell}>Campaigns</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={5} className={styles.loadingCell}>
                      <div className={styles.spinner}></div>
                      <p>Loading users...</p>
                    </td>
                  </tr>
                ) : usersList.length > 0 ? (
                  usersList.map((user) => (
                    <tr key={user.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.memberCell}>
                          <div className={styles.memberAvatar}>
                            {user.firstName[0]}
                          </div>
                          <div>
                            <span className={styles.userName}>
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        {user.phone && (
                          <a
                            href={`tel:${user.phone}`}
                            className={styles.phoneLink}
                          >
                            <FiPhone className={styles.icon} />
                            {user.phone}
                          </a>
                        )}
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.rolesList}>
                          {user.roles.length > 0 ? (
                            user.roles.map((r: string) => (
                              <span
                                key={r}
                                className={`${styles.roleBadge} ${styles[r.toLowerCase()] || ""}`}
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className={styles.noRole}>
                              No Campaign Role
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.campaignNames}>
                          {user.campaigns.length > 0 ? (
                            user.campaigns.join(", ")
                          ) : (
                            <span className={styles.noneText}>None</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.status} ${user.isActive ? styles.active : ""}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.noMembers}>
                      No users found in this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Pagination */}
          {userTotalPages > 1 && (
            <div className={styles.paginationControls}>
              <button
                disabled={userPage <= 1}
                onClick={() => setUserPage((prev) => prev - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {userPage} of {userTotalPages}
              </span>
              <button
                disabled={userPage >= userTotalPages}
                onClick={() => setUserPage((prev) => prev + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Brands Directory Tab */}
      {activeTab === "brands" && (
        <div className={styles.brandsSection}>
          <div className={styles.controls}>
            <div className={styles.searchBar}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearchQuery}
                onChange={(e) => {
                  setBrandSearchQuery(e.target.value);
                  setBrandPage(1);
                }}
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.membersTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th
                    className={styles.tableHeaderCell}
                    style={{ width: "80px" }}
                  >
                    Logo
                  </th>
                  <th className={styles.tableHeaderCell}>Brand Name</th>
                  <th className={styles.tableHeaderCell}>Description</th>
                  <th className={styles.tableHeaderCell}>Created At</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isBrandsLoading ? (
                  <tr>
                    <td colSpan={5} className={styles.loadingCell}>
                      <div className={styles.spinner}></div>
                      <p>Loading brands...</p>
                    </td>
                  </tr>
                ) : brandsList.length > 0 ? (
                  brandsList.map((brand) => (
                    <tr key={brand.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.brandLogoCol}>
                          {brand.image ? (
                            <img
                              src={brand.image}
                              alt={brand.name}
                              className={styles.brandLogoImg}
                            />
                          ) : (
                            <div className={styles.brandLogoPlaceholder}>
                              {brand.name[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.brandNameText}>
                          {brand.name}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.brandDescText}>
                          {brand.description || "-"}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.status} ${brand.isActive ? styles.active : ""}`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.noMembers}>
                      No brands found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Brand Pagination */}
          {brandTotalPages > 1 && (
            <div className={styles.paginationControls}>
              <button
                disabled={brandPage <= 1}
                onClick={() => setBrandPage((prev) => prev - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {brandPage} of {brandTotalPages}
              </span>
              <button
                disabled={brandPage >= brandTotalPages}
                onClick={() => setBrandPage((prev) => prev + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SupervisorModal
        isOpen={isSupervisorModalOpen}
        campaignId={selectedCampaignId}
        organizationId={selectedCampaign?.organizationId || ""}
        onClose={() => !isAddingSupervisor && setIsSupervisorModalOpen(false)}
        onAddSuccess={() => fetchMyCampaigns(campaignPage, campaignLimit)}
        onSelect={handleSupervisorSelect}
        existingSupervisors={
          selectedCampaign?.members?.map((m: any) => m.userId) || []
        }
        isLoading={isAddingSupervisor}
      />

      <ExecutorModal
        isOpen={isExecutorModalOpen}
        campaignId={selectedCampaignId}
        organizationId={selectedCampaign?.organizationId || ""}
        onClose={() => !isAddingExecutor && setIsExecutorModalOpen(false)}
        onAddSuccess={() => fetchMyCampaigns(campaignPage, campaignLimit)}
        onSelect={handleExecutorSelect}
        existingExecutors={
          selectedCampaign?.members?.map((m: any) => m.userId) || []
        }
        isLoading={isAddingExecutor}
      />

      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={fetchBrands}
      />
    </div>
  );
};

export default TeamManagementPage;
