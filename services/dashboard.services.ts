import { prisma } from '@/lib/prisma';
import { CampaignService } from '@/services/campaign.services';
import type { CreateCampaignInput, CampaignResponse } from '@/types/campaign';

export const dashboardService = {
  async getSummary(organizationId?: string) {
    try {
      // Use the existing campaign service to get campaigns with tasks
      const campaignService = new CampaignService();
      const campaignsResult = await campaignService.getCampaigns({
        page: 1,
        limit: 1000, // Get all campaigns
        memberId: '', // Will be filtered by auth middleware
        organizationId, // Filter by organization
      });

      const campaigns = campaignsResult.data || [];
      
      // Calculate totals from campaigns data (which now includes tasks)
      const totalCampaigns = campaigns.length;
      const totalTasks = campaigns.reduce((sum: number, campaign: CampaignResponse) => sum + (campaign.totalTasks || 0), 0);
      const completedTasks = campaigns.reduce((sum: number, campaign: CampaignResponse) => sum + (campaign.taskCount || 0), 0);
      const pendingTasks = campaigns.reduce((sum: number, campaign: CampaignResponse) => sum + Math.max(0, (campaign.totalTasks || 0) - (campaign.taskCount || 0)), 0);

      return {
        totalCampaigns,
        totalTasks,
        completedTasks,
        pendingTasks,
      };
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }
};