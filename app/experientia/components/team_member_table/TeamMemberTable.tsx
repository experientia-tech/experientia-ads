'use client';
import { useState } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiUser, FiPhone, FiMapPin, FiUserCheck } from 'react-icons/fi';
import styles from './TeamMemberTable.module.scss';

interface TeamMember {
  id: string;
  name: string;
  contactNumber: string;
  role: string;
  location: string;
  assignedBy: string;
  status: 'active' | 'inactive' | 'pending';
}

interface TeamMemberTableProps {
  members: TeamMember[];
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({ members = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const roles = ['all', ...Array.from(new Set(members.map(member => member.role)))];

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contactNumber.includes(searchTerm) ||
      member.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.assignedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className={styles.teamMemberTable}>
      <div className={styles.tableHeader}>
        <h3>Team Members</h3>
        <div className={styles.tableControls}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterDropdown}>
            <button 
              className={styles.filterButton}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FiFilter />
              <span>Filter by Role</span>
              {isFilterOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {isFilterOpen && (
              <div className={styles.dropdownMenu}>
                {roles.map(role => (
                  <button
                    key={role}
                    className={`${styles.dropdownItem} ${roleFilter === role ? styles.active : ''}`}
                    onClick={() => {
                      setRoleFilter(role);
                      setIsFilterOpen(false);
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Number</th>
              <th>Role</th>
              <th>Location</th>
              <th>Assigned By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.memberInfo}>
                      <div className={styles.avatar}>
                        <FiUser />
                      </div>
                      {member.name}
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactCell}>
                      <FiPhone className={styles.icon} />
                      {member.contactNumber}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[member.role.toLowerCase()]}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <div className={styles.locationCell}>
                      <FiMapPin className={styles.icon} />
                      {member.location}
                    </div>
                  </td>
                  <td>
                    <div className={styles.assignedBy}>
                      <FiUserCheck className={styles.icon} />
                      {member.assignedBy}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noResults}>
                  No team members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamMemberTable;