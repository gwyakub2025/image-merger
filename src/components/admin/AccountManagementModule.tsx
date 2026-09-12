import React, { useState } from 'react';
import { 
  AdminAccount, 
  AccountTier, 
  AccountStatus 
} from '../../types/admin';
import { 
  Building2, 
  Plus, 
  Layers, 
  FileEdit, 
  ArrowRightLeft, 
  FileBarChart2, 
  TableProperties, 
  Maximize2, 
  Sparkles, 
  Check, 
  X, 
  Edit2, 
  CreditCard, 
  MapPin, 
  Mail, 
  Users, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AccountManagementModuleProps {
  accounts: AdminAccount[];
  onAddAccount: (account: AdminAccount) => void;
  onUpdateAccount: (accountId: string, partial: Partial<AdminAccount>) => void;
  onShowToast: (msg: string) => void;
}

const TIER_META: Record<AccountTier, { label: string; badge: string; border: string }> = {
  enterprise_dedicated: {
    label: 'Enterprise Dedicated',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    border: 'border-purple-300',
  },
  business_pro: {
    label: 'Business Pro',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    border: 'border-indigo-300',
  },
  departmental: {
    label: 'Departmental Tier',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    border: 'border-sky-300',
  },
  starter: {
    label: 'Starter Tier',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-300',
  },
};

export const AccountManagementModule: React.FC<AccountManagementModuleProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onShowToast,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);

  // New Account Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tier, setTier] = useState<AccountTier>('business_pro');
  const [licenseSeats, setLicenseSeats] = useState(25);
  const [monthlyQuota, setMonthlyQuota] = useState(50000);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [region, setRegion] = useState('Dubai, UAE');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      onShowToast('Please provide an organization name and contact email');
      return;
    }

    const created: AdminAccount = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase() || `GW-${Math.floor(Math.random() * 900 + 100)}`,
      tier,
      status: 'active',
      licenseSeats,
      usedSeats: 1,
      monthlyQuotaSheets: monthlyQuota,
      usedQuotaSheets: 0,
      contactEmail: contactEmail.trim(),
      contactPerson: contactPerson.trim() || 'Account Manager',
      region: region.trim(),
      billingCycle,
      validUntil: '2027-12-31',
      enabledModules: {
        batcher: true,
        converter: true,
        resizer: true,
        pdfEditor: true,
        wpsExtractor: tier === 'enterprise_dedicated',
        sheetMerger: tier === 'enterprise_dedicated',
        aiCreator: tier === 'enterprise_dedicated',
      },
    };

    onAddAccount(created);
    onShowToast(`Client organization "${created.name}" created successfully!`);
    setIsAddModalOpen(false);

    // Reset
    setName('');
    setCode('');
    setContactEmail('');
    setContactPerson('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    onUpdateAccount(editingAccount.id, editingAccount);
    onShowToast(`Updated organization "${editingAccount.name}"`);
    setEditingAccount(null);
  };

  const toggleModule = (acc: AdminAccount, moduleKey: keyof AdminAccount['enabledModules']) => {
    const updated = {
      ...acc.enabledModules,
      [moduleKey]: !acc.enabledModules[moduleKey],
    };
    onUpdateAccount(acc.id, { enabledModules: updated });
    onShowToast(`Toggled ${moduleKey} for ${acc.name}`);
  };

  return (
    <div id="admin-accounts-module" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Enterprise Accounts &amp; Tenant Management
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {accounts.length} Organizations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-tenant enterprise contracts, license seat quotas, module entitlements, and regional compliance settings.
          </p>
        </div>

        <button
          type="button"
          id="admin-add-account-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {accounts.map((acc) => {
          const tierMeta = TIER_META[acc.tier] || TIER_META.business_pro;
          const seatsPercent = Math.round((acc.usedSeats / acc.licenseSeats) * 100);
          const quotaPercent = Math.round((acc.usedQuotaSheets / acc.monthlyQuotaSheets) * 100);

          return (
            <div
              key={acc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{acc.name}</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {acc.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierMeta.badge}`}>
                          {tierMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingAccount(acc)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit Account Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Location & Contact */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-2 border-y border-slate-100 my-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{acc.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{acc.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="capitalize">{acc.billingCycle} Billing • {acc.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Contract: {acc.validUntil}</span>
                  </div>
                </div>

                {/* Meters: Seats & Quotas */}
                <div className="grid grid-cols-2 gap-4 my-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-semibold text-slate-600">Assigned Seats</span>
                      <span className="font-mono text-slate-700 font-bold">{acc.usedSeats} / {acc.licenseSeats}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, seatsPercent)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {seatsPercent}% seat capacity
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-semibold text-slate-600">Monthly Sheet Cap</span>
                      <span className="font-mono text-slate-700 font-bold">{acc.usedQuotaSheets.toLocaleString()} / {acc.monthlyQuotaSheets.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          quotaPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, quotaPercent)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {quotaPercent}% quota consumed
                    </span>
                  </div>
                </div>

                {/* Module Entitlements Switchers */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Module Access Entitlements
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'batcher', label: 'A4 Batcher', icon: Layers },
                      { key: 'pdfEditor', label: 'PDF Editor', icon: FileEdit },
                      { key: 'converter', label: 'Converter', icon: ArrowRightLeft },
                      { key: 'wpsExtractor', label: 'WPS Extractor', icon: FileBarChart2 },
                      { key: 'sheetMerger', label: 'Sheet Merger', icon: TableProperties },
                      { key: 'resizer', label: 'Image Sizer', icon: Maximize2 },
                      { key: 'aiCreator', label: 'AI Gen', icon: Sparkles },
                    ].map((mod) => {
                      const isEnabled = (acc.enabledModules as any)[mod.key];
                      const Icon = mod.icon;

                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => toggleModule(acc, mod.key as any)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isEnabled
                              ? 'bg-slate-900 text-white border-slate-800'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                          }`}
                          title={`Click to ${isEnabled ? 'disable' : 'enable'} ${mod.label}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{mod.label}</span>
                          {isEnabled ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Account Manager: <strong className="text-slate-700">{acc.contactPerson}</strong></span>
                <span className="font-mono text-emerald-700 font-bold">SLA: 99.9% High Availability</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Client Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Provision New Enterprise Client Account</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Configure organization tenant, subscription tier, and processing limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dubai Ports World Logistics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organization Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DPW-HQ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subscription Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as AccountTier)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="enterprise_dedicated">Enterprise Dedicated</option>
                    <option value="business_pro">Business Pro</option>
                    <option value="departmental">Departmental</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">License Seat Allocation</label>
                  <input
                    type="number"
                    min={5}
                    value={licenseSeats}
                    onChange={(e) => setLicenseSeats(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Sheet Limit</label>
                  <input
                    type="number"
                    step={5000}
                    value={monthlyQuota}
                    onChange={(e) => setMonthlyQuota(parseInt(e.target.value) || 25000)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="admin@dpw.ae"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Regional Branch</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Dubai, UAE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
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
                  Create Client Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" />
                  <span>Edit Account: {editingAccount.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subscription Tier</label>
                  <select
                    value={editingAccount.tier}
                    onChange={(e) => setEditingAccount({ ...editingAccount, tier: e.target.value as AccountTier })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="enterprise_dedicated">Enterprise Dedicated</option>
                    <option value="business_pro">Business Pro</option>
                    <option value="departmental">Departmental</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value as AccountStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="past_due">Past Due</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Seats</label>
                  <input
                    type="number"
                    value={editingAccount.licenseSeats}
                    onChange={(e) => setEditingAccount({ ...editingAccount, licenseSeats: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Sheets Cap</label>
                  <input
                    type="number"
                    step={1000}
                    value={editingAccount.monthlyQuotaSheets}
                    onChange={(e) => setEditingAccount({ ...editingAccount, monthlyQuotaSheets: parseInt(e.target.value) || 10000 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
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
    </div>
  );
};
