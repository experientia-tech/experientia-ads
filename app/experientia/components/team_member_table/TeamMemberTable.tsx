'use client';
import { useState } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import styles from './TeamMemberTable.module.scss';
import ConfirmDialog from '../../../components/confirm_dialog/ConfirmDialog';
import ErrorModal from '../error_modal/ErrorModal';

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
  onDelete?: (memberId: string) => Promise<void>;
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({ members = [], onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [memberPendingDelete, setMemberPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteClick = (memberId: string) => {
    if (!onDelete) return;
    setMemberPendingDelete(memberId);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete || !memberPendingDelete) return;
    const memberId = memberPendingDelete;
    try {
      setDeletingId(memberId);
      await onDelete(memberId);
      setMemberPendingDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      setMemberPendingDelete(null);
      setDeleteError('Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.memberInfo}>
                      {member.name}
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactCell}>
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
                      {member.location}
                    </div>
                  </td>
                  <td>
                    <div className={styles.assignedBy}>
                      {member.assignedBy}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteClick(member.id)}
                      disabled={deletingId === member.id}
                      title="Remove member"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={styles.noResults}>
                  No team members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={memberPendingDelete !== null}
        title="Remove team member?"
        message="Are you sure you want to remove this member? This action cannot be undone."
        confirmText="Remove"
        isConfirming={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMemberPendingDelete(null)}
      />

      <ErrorModal
        isOpen={deleteError !== null}
        title="Error"
        message={deleteError ?? undefined}
        onClose={() => setDeleteError(null)}
      />
    </div>
  );
};

export default TeamMemberTable;