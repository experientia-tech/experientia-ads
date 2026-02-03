import { prisma } from '@/lib/prisma';

export const dashboardService = {
  async getSummary() {
    try {
      const totalCampaigns = await prisma.campaign.count();
      const totalTasks = await prisma.task.count();
      const completedTasks = await prisma.task.count({
        where: { status: 'COMPLETED' }
      });
      const pendingTasks = totalTasks - completedTasks;
      const flaggedTasks = await prisma.task.count({
        where: { flagged: true }
      });

      return {
        totalCampaigns,
        totalTasks,
        completedTasks,
        pendingTasks,
        flaggedTasks
      };
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }
};