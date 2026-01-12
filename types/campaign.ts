export type CampaignStatus = 'Active' | 'Completed' | 'Cancelled';

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
}

export interface CampaignResponse extends Omit<CreateCampaignInput, 'startDate' | 'endDate'> {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}
