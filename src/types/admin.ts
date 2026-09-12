export type AdminRole = 
  | 'super_admin' 
  | 'org_admin' 
  | 'compliance_officer' 
  | 'operations_manager' 
  | 'operator' 
  | 'viewer';

export type UserStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export type AccountTier = 'enterprise_dedicated' | 'business_pro' | 'departmental' | 'starter';

export type AccountStatus = 'active' | 'past_due' | 'trial' | 'suspended';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  accountId: string;
  accountName: string;
  department: string;
  status: UserStatus;
  lastActive: string;
  quotaUsedSheets: number;
  quotaMaxSheets: number;
  twoFactorEnabled: boolean;
  createdAt: string;
  phone?: string;
  avatarBg?: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  code: string;
  tier: AccountTier;
  status: AccountStatus;
  licenseSeats: number;
  usedSeats: number;
  monthlyQuotaSheets: number;
  usedQuotaSheets: number;
  contactEmail: string;
  contactPerson: string;
  region: string;
  billingCycle: 'annual' | 'monthly';
  validUntil: string;
  enabledModules: {
    batcher: boolean;
    converter: boolean;
    resizer: boolean;
    pdfEditor: boolean;
    wpsExtractor: boolean;
    sheetMerger: boolean;
    aiCreator: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  action: string;
  module: 'batcher' | 'converter' | 'resizer' | 'pdf_editor' | 'wps' | 'sheet_merger' | 'admin' | 'auth';
  ipAddress: string;
  location: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

export interface DailyUsagePoint {
  date: string;
  displayDate: string;
  totalSheets: number;
  conversions: number;
  pdfEdits: number;
  wpsRuns: number;
  activeUsers: number;
}

export interface ModuleUsageStat {
  moduleKey: string;
  name: string;
  totalOperations: number;
  totalVolume: string;
  growthPercentage: number;
  color: string;
  iconName: string;
}

export interface GlobalUsageStats {
  totalProcessedSheets: number;
  totalOriginalDataSizeGb: number;
  totalSavedBandwidthGb: number;
  totalActiveAccounts: number;
  totalRegisteredUsers: number;
  totalActiveToday: number;
  averageProcessingTimeMs: number;
  uptimePercentage: number;
  costSavingsEstimatedAed: number;
  dailyTrend: DailyUsagePoint[];
  moduleBreakdown: ModuleUsageStat[];
}

export type AdminSubTab = 'overview' | 'users' | 'accounts' | 'usage' | 'audit' | 'roles';
