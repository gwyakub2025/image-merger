import React, { useState, useMemo } from 'react';
import { 
  AdminUser, 
  AdminRole, 
  UserStatus, 
  AdminAccount 
} from '../../types/admin';
import { 
  Search, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Key, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Building2,
  Lock,
  Mail,
  Phone,
  Filter
} from 'lucide-react';

interface UserManagementModuleProps {
  users: AdminUser[];
  accounts: AdminAccount[];
  onAddUser: (user: AdminUser) => void;
  onUpdateUser: (userId: string, partial: Partial<AdminUser>) => void;
  onDeleteUser: (userId: string) => void;
  onShowToast: (msg: string) => void;
}

const ROLE_LABELS: Record<AdminRole, { label: string; badge: string; desc: string }> = {
  super_admin: { 
    label: 'Super Admin', 
    badge: 'bg-purple-100 text-purple-800 border-purple-200', 
    desc: 'Full system root privileges, account provisioning, global audit logs & engine settings' 
  },
  org_admin: { 
    label: 'Org Admin', 
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
    desc: 'Manage departmental users, allocate seat quotas, and view organization-wide reports' 
  },
  compliance_officer: { 
    label: 'Compliance Officer', 
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
    desc: 'Full access to WPS SIF validation, PDF redactions, and regulatory payroll records' 
  },
  operations_manager: { 
    label: 'Operations Manager', 
    badge: 'bg-sky-100 text-sky-800 border-sky-200', 
    desc: 'Supervise batch packaging queues, format conversion pipelines, and document throughput' 
  },
  operator: { 
    label: 'Operator', 
    badge: 'bg-slate-100 text-slate-700 border-slate-200', 
    desc: 'Standard access to A4 batching, image sizing, and format converters' 
  },
  viewer: { 
    label: 'Auditor / Viewer', 
    badge: 'bg-amber-100 text-amber-800 border-amber-200', 
    desc: 'Read-only access to audit logs, generated batches, and compliance reports' 
  },
};

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  users,
  accounts,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminRole>('operator');
  const [newUserAccountId, setNewUserAccountId] = useState(accounts[0]?.id || '');
  const [newUserDepartment, setNewUserDepartment] = useState('Logistics & Documentation');
  const [newUserQuota, setNewUserQuota] = useState(5000);
  const [newUserPhone, setNewUserPhone] = useState('+971 4 ');

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.accountName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesAccount = accountFilter === 'all' || u.accountId === accountFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesAccount;
    });
  }, [users, searchQuery, roleFilter, statusFilter, accountFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      onShowToast('Please fill in required name and email');
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === newUserAccountId) || accounts[0];

    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-purple-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: AdminUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      department: newUserDepartment.trim(),
      status: 'active',
      lastActive: 'Just registered',
      quotaUsedSheets: 0,
      quotaMaxSheets: newUserQuota,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString().split('T')[0],
      phone: newUserPhone.trim(),
      avatarBg: randomColor,
    };

    onAddUser(created);
    onShowToast(`User ${created.name} provisioned successfully!`);
    setIsAddModalOpen(false);

    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDepartment('Logistics & Documentation');
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser.id, editingUser);
    onShowToast(`Updated details for ${editingUser.name}`);
    setEditingUser(null);
  };

  const handleToggleUserStatus = (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    onUpdateUser(user.id, { status: nextStatus });
    onShowToast(`User ${user.name} is now ${nextStatus.toUpperCase()}`);
    setActiveMenuUserId(null);
  };

  const handleSendInvite = (user: AdminUser) => {
    onShowToast(`Sent security login link & 2FA invitation to ${user.email}`);
    setActiveMenuUserId(null);
  };

  return (
    <div id="admin-user-management-module" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Enterprise User &amp; Role Management
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredUsers.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision user accounts, assign role-based access control (RBAC), and manage monthly processing quotas across corporate tenants.
          </p>
        </div>

        <button
          type="button"
          id="admin-add-user-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="admin-user-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department, or company..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="org_admin">Org Admin</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="operations_manager">Operations Manager</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 max-w-[160px] truncate"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization &amp; Dept</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Quota Utilization</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No users matched your query</p>
                    <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const quotaPercent = Math.min(100, Math.round((u.quotaUsedSheets / (u.quotaMaxSheets || 1)) * 100));
                  const roleCfg = ROLE_LABELS[u.role];

                  return (
                    <tr 
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${u.avatarBg || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                            {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleCfg.badge}`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{roleCfg.label}</span>
                        </span>
                      </td>

                      {/* Organization & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700 text-xs truncate max-w-[180px]">
                          {u.accountName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {u.department}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Pending
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Active: {u.lastActive}
                        </div>
                      </td>

                      {/* Quota Progress */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-bold text-slate-700">{u.quotaUsedSheets.toLocaleString()}</span>
                          <span className="text-slate-400">/ {u.quotaMaxSheets.toLocaleString()} sheets</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quotaPercent > 85 ? 'bg-rose-500' : quotaPercent > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${quotaPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 text-right mt-0.5 font-mono">
                          {quotaPercent}% used
                        </div>
                      </td>

                      {/* Security / 2FA */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.twoFactorEnabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Lock className="w-3 h-3 text-emerald-600" />
                              <span>2FA On</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              <span>No 2FA</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit User Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="More Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuUserId === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  {u.status === 'active' ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Suspend Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Activate Account</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendInvite(u)}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Key className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Send Password Reset</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete User</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Provision New Enterprise User</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Set access permissions, corporate tenant affiliation, and monthly batch quotas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@gulfwaygroup.ae"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organization / Tenant</label>
                  <select
                    value={newUserAccountId}
                    onChange={(e) => setNewUserAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    placeholder="e.g. Payroll Compliance"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Access Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="org_admin">Org Admin</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="operations_manager">Operations Manager</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Sheet Quota</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={newUserQuota}
                    onChange={(e) => setNewUserQuota(parseInt(e.target.value) || 5000)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-800">Role Capability:</span> {ROLE_LABELS[newUserRole].desc}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Edit User Profile: {editingUser.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AdminRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="org_admin">Org Admin</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="operations_manager">Operations Manager</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Sheet Quota</label>
                  <input
                    type="number"
                    value={editingUser.quotaMaxSheets}
                    onChange={(e) => setEditingUser({ ...editingUser, quotaMaxSheets: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={editingUser.twoFactorEnabled}
                      onChange={(e) => setEditingUser({ ...editingUser, twoFactorEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>2FA Enforced</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete User Account</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete user <span className="font-bold text-slate-800">{userToDelete.name}</span> ({userToDelete.email})? This action will revoke all permissions and release their assigned seat quota.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  onShowToast(`User ${userToDelete.name} deleted.`);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
