export type CampaignStatus = 'Active' | 'Completed' | 'Cancelled';

export interface CampaignMemberInput {
  userId: string;
  role: 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER';
}

export interface CampaignTaskInput {
  title: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  executorUserId: string;
  dueDate?: Date | string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
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
  members?: CampaignMemberInput[];
  tasks?: CampaignTaskInput[];
  createdBy: string; // ID of the user creating the campaign (will be the first campaign manager)
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
  role: 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER';
  assignedAt: Date;
  active: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CampaignResponse {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  status: string;
  createdBy: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  serviceType?: string;
  startDate: Date | null;
  endDate: Date | null;
  members: CampaignMemberResponse[];
  tasks: CampaignTaskResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}
