export interface ISendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IVerifyOtpResponse {
  success: boolean;
  message?: string;
  data?: string;
  token?: string;
  error?: string;
}

export interface ICampaign {
  id: string | number;
  name: string;
  status: string;
  serviceType: string;
  description: string;
  organizationId: string;
  address: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  flaggedTasks?: number;
  members: any[];
  tasks: Array<{ status: string }>;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface IDashboardSummary {
  totalCampaigns: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  flaggedTasks: number;
  campaigns: ICampaign[];
}

export interface IProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  lastLoginAt: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
