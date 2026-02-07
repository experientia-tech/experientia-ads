'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.scss';
import { FiSearch, FiChevronDown, FiChevronUp, FiPhone, FiMail, FiUser } from 'react-icons/fi';
import { useCampaignStore } from '@/app/store/Campaigns';

const TeamManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { campaigns, fetchMyCampaigns } = useCampaignStore();
  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchMyCampaigns();
    }
  }, [fetchMyCampaigns]);

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.teamPage}>
      <div className={styles.header}>
        <h1>Team Management</h1>
        <p className={styles.subtitle}>All Campaigns</p>
      </div>

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
              onClick={() => toggleCampaign(campaign.id?.toString() || '')}
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
                    {campaign.members?.filter(m => m.active).length || 0} Active
                  </span>
                </div>
              </div>
              <div className={styles.chevron}>
                {expandedCampaign === campaign.id ? <FiChevronUp /> : <FiChevronDown />}
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
                            <a href={`tel:${member.user.phone}`} className={styles.phoneLink}>
                              <FiPhone className={styles.icon} />
                              {member.user.phone}
                            </a>
                          )}
                        </td>
                        <td className={styles.tableCell}>{member.role}</td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.status} ${member.active ? styles.active : ''}`}>
                            {member.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!campaign.members || campaign.members.length === 0) && (
                  <div className={styles.noMembers}>No team members found for this campaign.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManagementPage;