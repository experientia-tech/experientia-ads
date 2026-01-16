'use client';
import React, { useState } from 'react';
import styles from './page.module.scss';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPhone, FiMail, FiUser, FiCheck, FiX } from 'react-icons/fi';

// Mock data for campaigns and team members
const campaignsData = [
  {
    id: 1,
    name: 'Summer Collection',
    totalMembers: 5,
    activeMembers: 4,
    members: [
      { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 890', role: 'Content Creator', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 891', role: 'Designer', status: 'active' },
      { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1 234 567 892', role: 'Developer', status: 'inactive' },
      { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1 234 567 893', role: 'Manager', status: 'active' },
      { id: 5, name: 'Alex Brown', email: 'alex@example.com', phone: '+1 234 567 894', role: 'Content Creator', status: 'active' },
    ]
  },
  // Add more campaigns as needed
];

const TeamManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);

  const toggleCampaign = (campaignId: number) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

  // Filter campaigns based on search
  const filteredCampaigns = campaignsData.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [roleFilter, setRoleFilter] = useState('');
const [campaignFilter, setCampaignFilter] = useState('');
const [showActiveOnly, setShowActiveOnly] = useState(false);

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
          
          <div className={styles.filterGroup}>
            <select 
              id="campaignFilter" 
              className={styles.filterSelect}
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="">All Campaigns</option>
              {campaignsData.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
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
      </div>

      <div className={styles.campaignsList}>
        {filteredCampaigns.map((campaign) => (
          <div key={campaign.id} className={styles.campaignCard}>
            <div 
              className={styles.campaignHeader}
              onClick={() => toggleCampaign(campaign.id)}
            >
              <div className={styles.campaignInfo}>
                <h3>{campaign.name}</h3>
                <div className={styles.stats}>
                  <span className={styles.statItem}>
                    <FiUser className={styles.statIcon} />
                    {campaign.totalMembers} Members
                  </span>
                  <span className={`${styles.statItem} ${styles.active}`}>
                    <FiCheck className={styles.statIcon} />
                    {campaign.activeMembers} Active
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
                      <th className={styles.tableHeaderCell}>Email</th>
                      <th className={styles.tableHeaderCell}>Phone</th>
                      <th className={styles.tableHeaderCell}>Role</th>
                      <th className={styles.tableHeaderCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.members.map((member) => (
                      <tr key={member.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.memberCell}>
                            <FiUser className={styles.userIcon} />
                            {member.name}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <a href={`mailto:${member.email}`} className={styles.emailLink}>
                            <FiMail className={styles.icon} />
                            {member.email}
                          </a>
                        </td>
                        <td className={styles.tableCell}>
                          <a href={`tel:${member.phone}`} className={styles.phoneLink}>
                            <FiPhone className={styles.icon} />
                            {member.phone}
                          </a>
                        </td>
                        <td className={styles.tableCell}>{member.role}</td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.status} ${member.status === 'active' ? styles.active : ''}`}>
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManagementPage;