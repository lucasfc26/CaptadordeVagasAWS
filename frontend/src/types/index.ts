// ============================================
// JobWatch - Type Definitions
// ============================================

// --- Auth ---
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  timezone?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

// --- Jobs ---
export type JobStatus = 'NEW' | 'VIEWED' | 'APPLIED' | 'EXPIRED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | 'TEMPORARY';

export interface JobLocation {
  city: string;
  state: string;
  distance?: number;
}

export interface Job {
  id: string;
  title: string;
  location: JobLocation;
  jobType: JobType;
  facility: string;
  description?: string;
  requirements?: string[];
  salary?: string;
  schedule?: string;
  benefits?: string[];
  externalUrl: string;
  status: JobStatus;
  searchId: string;
  foundAt: string;
  viewedAt?: string;
  appliedAt?: string;
}

// --- Searches / Monitoring ---
export type SearchStatus = 'ACTIVE' | 'PAUSED' | 'ERROR';
export type MonitoringFrequency = '5min' | '15min' | '30min' | '1h' | '2h' | '6h' | '12h' | '24h';
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS';

export interface SearchFilters {
  keywords: string[];
  jobTypes: JobType[];
  additionalCities: string[];
}

export interface SearchConfig {
  name: string;
  location: string;
  radius: number;
  keywords: string[];
  jobTypes: JobType[];
  additionalCities: string[];
  frequency: MonitoringFrequency;
  notificationChannels: NotificationChannel[];
}

export interface Search {
  id: string;
  name: string;
  location: string;
  radius: number;
  keywords: string[];
  jobTypes: JobType[];
  additionalCities: string[];
  frequency: MonitoringFrequency;
  notificationChannels: NotificationChannel[];
  status: SearchStatus;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  jobsFound: number;
  newJobsFound: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// --- Monitoring Execution ---
export type ExecutionStatus = 'SUCCESS' | 'ERROR' | 'RUNNING';

export interface MonitoringExecution {
  id: string;
  searchId: string;
  status: ExecutionStatus;
  jobsFound: number;
  newJobsFound: number;
  errorMessage?: string;
  executedAt: string;
  duration?: number;
}

// --- Notifications ---
export type NotificationStatus = 'SENT' | 'FAILED' | 'PENDING' | 'READ';
export type NotificationType = 'NEW_JOB' | 'MONITORING_ERROR' | 'MONITORING_PAUSED' | 'SUMMARY';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  jobId?: string;
  searchId?: string;
  createdAt: string;
  readAt?: string;
}

// --- Dashboard ---
export interface DashboardStats {
  newJobs: number;
  availableJobs: number;
  activeSearches: number;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  monitoringActive: boolean;
}

// --- API ---
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// --- Filters ---
export interface JobFilters {
  location?: string;
  title?: string;
  jobType?: JobType;
  status?: JobStatus;
  onlyNew?: boolean;
  searchId?: string;
  sortBy?: 'newest' | 'oldest' | 'location' | 'title';
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  read?: boolean;
  page?: number;
  limit?: number;
}

// --- Settings ---
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newJobAlert: boolean;
    periodicSummary: boolean;
  };
  monitoring: {
    defaultFrequency: MonitoringFrequency;
    timezone: string;
  };
}
