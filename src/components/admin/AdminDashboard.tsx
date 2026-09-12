import React, { useState, useEffect } from 'react';
import { 
  AdminUser, 
  AdminAccount, 
  GlobalUsageStats, 
  AuditLogEntry, 
  AdminSubTab 
} from '../../types/admin';
import { 
  INITIAL_USERS, 
  INITIAL_ACCOUNTS, 
  INITIAL_GLOBAL_STATS, 
  INITIAL_AUDIT_LOGS 
} from '../../data/mockAdminData';
import { UserManagementModule } from './UserManagementModule';
import { AccountManagementModule } from './AccountManagementModule';
import { GlobalUsageModule } from './GlobalUsageModule';
import { AuditLogModule } from './AuditLogModule';
import { GulfWayLogo } from '../GulfWayLogo';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  BarChart3, 
  FileText, 
  ArrowLeft, 
  Sliders, 
  CheckCircle2, 
  Activity, 
  LayoutDashboard,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToWorkbench: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToWorkbench,
  onShowToast,
}) => {
  // Master state
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('gw_admin_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USERS;
  });

  const [accounts, setAccounts] = useState<AdminAccount[]>(() => {
    const saved = localStorage.getItem('gw_admin_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_ACCOUNTS;
  });

  const [stats, setStats] = useState<GlobalUsageStats>(INITIAL_GLOBAL_STATS);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Sub-tab navigation with URL hash synchronisation
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('users')) return 'users';
      if (hash.includes('accounts')) return 'accounts';
      if (hash.includes('usage')) return 'usage';
      if (hash.includes('audit')) return 'audit';
    }
    return 'overview';
  });

  // Sync route / hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('users')) setActiveSubTab('users');
      else if (hash.includes('accounts')) setActiveSubTab('accounts');
      else if (hash.includes('usage')) setActiveSubTab('usage');
      else if (hash.includes('audit')) setActiveSubTab('audit');
      else if (hash.includes('admin')) setActiveSubTab('overview');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectSubTab = (tab: AdminSubTab) => {
    setActiveSubTab(tab);
    if (typeof window !== 'undefined') {
      const hashName = tab === 'overview' ? 'admin' : `admin/${tab}`;
      window.location.hash = hashName;
    }
  };

  // State persistence
  useEffect(() => {
    localStorage.setItem('gw_admin_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gw_admin_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // User Actions
  const handleAddUser = (newUser: AdminUser) => {
    setUsers((prev) => [newUser, ...prev]);

    // Also record an audit log
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName: 'Zayed Al-Maktoum',
      userEmail: 'zayed.admin@gulfwaygroup.ae',
      action: `Provisioned New User: ${newUser.name}`,
      module: 'admin',
      ipAddress: '194.170.88.10',
      location: 'Dubai, UAE',
      status: 'success',
      details: `Assigned role ${newUser.role} in tenant ${newUser.accountName} with ${newUser.quotaMaxSheets} sheets limit.`,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateUser = (userId: string, partial: Partial<AdminUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...partial } : u))
    );
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (target) {
      const newLog: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        userName: 'Zayed Al-Maktoum',
        userEmail: 'zayed.admin@gulfwaygroup.ae',
        action: `Deleted User: ${target.name}`,
        module: 'admin',
        ipAddress: '194.170.88.10',
        location: 'Dubai, UAE',
        status: 'warning',
        details: `Revoked access for user ${target.email} (${target.accountName}).`,
      };
      setLogs((prev) => [newLog, ...prev]);
    }
  };

  // Account Actions
  const handleAddAccount = (newAcc: AdminAccount) => {
    setAccounts((prev) => [newAcc, ...prev]);
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName: 'Zayed Al-Maktoum',
      userEmail: 'zayed.admin@gulfwaygroup.ae',
      action: `Created Client Tenant: ${newAcc.name}`,
      module: 'admin',
      ipAddress: '194.170.88.10',
      location: 'Dubai, UAE',
      status: 'success',
      details: `Provisioned ${newAcc.tier} tier account with ${newAcc.licenseSeats} seats and ${newAcc.monthlyQuotaSheets} monthly sheets.`,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateAccount = (accountId: string, partial: Partial<AdminAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, ...partial } : acc))
    );
  };

  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const totalAllocatedSeats = accounts.reduce((sum, a) => sum + a.licenseSeats, 0);
  const totalUsedSeats = accounts.reduce((sum, a) => sum + a.usedSeats, 0);

  return (
    <div id="admin-dashboard-root" className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Admin Top Header Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToWorkbench}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Return to active A4 batching and tool workbench"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Tools</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg">
              <GulfWayLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  Gulf Way Group • Admin Console
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/50 rounded font-bold uppercase">
                  ENTERPRISE RBAC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Master Governance &amp; Multi-Tenant Telemetry Portal
              </p>
            </div>
          </div>
        </div>

        {/* User Profile & Quick Switch */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">Zayed Al-Maktoum</div>
            <div className="text-[10px] text-purple-300 font-mono">Super Administrator</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs border border-purple-400">
            ZA
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2 sticky top-[57px] z-20 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSelectSubTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('users')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('accounts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Accounts &amp; Tenants</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('usage')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeSubTab === 'usage'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Global Usage Statistics</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
              LIVE
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('audit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {activeSubTab === 'overview' ? (
          /* Executive High-Level Overview */
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {users.length}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {activeUsersCount} active now
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Client Tenants</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {accounts.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {totalUsedSeats} of {totalAllocatedSeats} license seats
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>A4 Sheets Processed</span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {stats.totalProcessedSheets.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Over 248k sheets rendered
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Engine Health</span>
                  <Activity className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {stats.uptimePercentage}%
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  99.98% High Availability
                </div>
              </div>
            </div>

            {/* Quick module navigation shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* User Governance Box */}
              <div 
                onClick={() => handleSelectSubTab('users')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Manage Users</h3>
                    <p className="text-xs text-slate-400">Roles, 2FA, &amp; quota limits</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provision employee accounts, assign Super Admin or Compliance Officer privileges, and track individual quota consumption.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>View All {users.length} Users →</span>
                </div>
              </div>

              {/* Accounts & Tenants Box */}
              <div 
                onClick={() => handleSelectSubTab('accounts')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Accounts &amp; Tenants</h3>
                    <p className="text-xs text-slate-400">Enterprise tiers &amp; licensing</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configure corporate multi-tenant organizations, allocate seats, and manage regional regulatory compliance rules.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Manage {accounts.length} Organizations →</span>
                </div>
              </div>

              {/* Telemetry & Analytics Box */}
              <div 
                onClick={() => handleSelectSubTab('usage')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Global Usage Telemetry</h3>
                    <p className="text-xs text-slate-400">Throughput, bandwidth &amp; speed</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Analyze volumetric document conversion, PDF redactions, WPS payroll validations, and client-side bandwidth savings.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>Inspect Live Telemetry →</span>
                </div>
              </div>
            </div>

            {/* Embedded Telemetry Snapshot */}
            <GlobalUsageModule stats={stats} onShowToast={onShowToast} />
          </div>
        ) : activeSubTab === 'users' ? (
          <UserManagementModule
            users={users}
            accounts={accounts}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onShowToast={onShowToast}
          />
        ) : activeSubTab === 'accounts' ? (
          <AccountManagementModule
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onShowToast={onShowToast}
          />
        ) : activeSubTab === 'usage' ? (
          <GlobalUsageModule stats={stats} onShowToast={onShowToast} />
        ) : (
          <AuditLogModule logs={logs} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
};
