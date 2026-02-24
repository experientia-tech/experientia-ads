export type CampaignStatus = 'Active' | 'Completed' | 'Cancelled';

export interface CampaignMemberInput {
  userId: string;
  role: 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER';
  assignedBy: string;
}

export interface TaskImage {
  url: string;
}

export interface CampaignTaskInput {
  images?: TaskImage[];
  latitude?: number;
  longitude?: number;
  address?: string;
  accuracy?: number;
  metadata?: any;
}

export interface CreateCampaignInput {
  name: string;
  description: string;
  organizationId: string;
  status?: CampaignStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  serviceType?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  totalTasks?: number;
  logo?: string;
}

export interface CampaignTaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  executorUserId: string;
  dueDate: Date | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  campaignId: string;
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  rejectionReason: string | null;
  flagged: boolean;
  notes: string | null;
  metadata: any;
}

export interface CampaignMemberResponse {
  id: string;
  campaignId: string;
  userId: string;
  assignedBy: string;
  assignedByName: string;
  role: 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER';
  assignedAt: Date;
  active: boolean;
  location?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CampaignResponse {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  status: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  serviceType?: string;
  startDate: Date | null;
  endDate: Date | null;
  logo?: string;
  members: CampaignMemberResponse[];
  tasks: CampaignTaskResponse[];
  totalTasks: number;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}
