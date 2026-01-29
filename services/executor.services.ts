import { prisma } from '@/lib/prisma';
import { CampaignTaskInput } from '@/types/campaign';

export async function getAllExecutors() {
  const executorAssignments = await prisma.campaignMember.findMany({
    where: {
      role: 'EXECUTOR',
      active: true,
    },
    distinct: ['userId'],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });
  
  return executorAssignments.map((assignment) => ({
    id: assignment.userId,
    firstName: assignment.user.firstName,
    lastName: assignment.user.lastName,
    phone: assignment.user.phone,
    role: 'EXECUTOR',
  }));
}

export async function getCampaigns(userId: string) {
    const campaignMembers = await prisma.campaignMember.findMany({
        where: {
            userId: userId,
            role: 'EXECUTOR',
        },
        include: {
            campaign: true,
        },
    });

    return campaignMembers.map((cm) => cm.campaign);
}
export async function createCampaignTask(campaignId: string, taskData: CampaignTaskInput, userId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: {
            userId,
            role: 'EXECUTOR',
          },
        },
        _count: {
          select: { tasks: true }
        }
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

   /*  if (campaign.members.length === 0) {
      throw new Error('You are not a member of this campaign or do not have permission to create tasks');
    } */

    if (campaign._count.tasks >= campaign.totalTasks) {
      throw new Error('This campaign has reached its maximum number of tasks');
    }

    const task = await prisma.task.create({
      data: {
        campaign: {
          connect: { id: campaignId }
        },
        executor: {
          connect: { id: userId }
        },
        metadata: {
          images: taskData.images || [],
          ...(taskData.latitude && taskData.longitude ? {
            location: {
              latitude: taskData.latitude,
              longitude: taskData.longitude,
              address: taskData.address || null
            }
          } : {})
        } as any,
      },
      include: {
        campaign: true,
      },
    });

    return task;
  } catch (error) {
    console.error('Error in createCampaignTask:', error);
    throw error;
  }
}

export async function getCampaignTasks(campaignId: string, userId: string) {
  // Verify the user is a member of the campaign
  const campaignMember = await prisma.campaignMember.findFirst({
    where: {
      campaignId,
      userId,
      role: 'EXECUTOR',
    },
  });

  if (!campaignMember) {
    throw new Error('You are not a member of this campaign');
  }

  // Get tasks for the campaign
  const tasks = await prisma.task.findMany({
    where: {
      campaignId,
      executorUserId: userId,
    },
    orderBy: {
      assignedAt: 'desc',
    },
  });

  return tasks;
}