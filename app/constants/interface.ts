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
 
export interface Campaign {
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
}

export interface DashboardSummary {
  totalCampaigns: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  flaggedTasks: number;
  campaigns: Campaign[];
}