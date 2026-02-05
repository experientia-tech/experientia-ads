import { prisma } from '@/lib/prisma';
import { CampaignTaskInput } from '@/types/campaign';

export async function addExecutor(firstName: string, lastName: string, phone: string, location: string, organizationId: string, campaignId: string, assignedBy: string) {
  // Check if phone number already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone },
    include: {
      campaignMembers: {
        where: {
          role: 'EXECUTOR',
          active: true
        }
      }
    }
  });

  let user;
  
  if (existingUser) {
    // Check if user is already an executor
    if (existingUser.campaignMembers.length > 0) {
      throw new Error('User with this phone number is already an executor');
    }
    
    // User exists but is not an executor, update their info
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName,
        lastName,
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        organizationId: true,
      }
    });
  } else {
    // Create new user if phone number doesn't exist
    user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        organizationId: true,
      }
    });
  }

  // Add user to campaign as executor
  const campaignMember = await prisma.campaignMember.create({
    data: {
      campaignId,
      userId: user.id,
      assignedBy,
      role: 'EXECUTOR',
      location,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        }
      }
    }
  });

  return {
    id: campaignMember.user.id,
    firstName: campaignMember.user.firstName,
    lastName: campaignMember.user.lastName,
    phone: campaignMember.user.phone,
    organizationId: organizationId,
    location: campaignMember.location,
    role: 'EXECUTOR',
  };
}

export async function getAllExecutors(organizationId?: string) {
  const executorAssignments = await prisma.campaignMember.findMany({
    where: {
      role: 'EXECUTOR',
      active: true,
      ...(organizationId && {
        user: {
          organizationId: organizationId
        }
      })
    },
    distinct: ['userId'],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          organizationId: true,
        },
      },
    },
  });
  
  return executorAssignments.map((assignment) => ({
    id: assignment.userId,
    firstName: assignment.user.firstName,
    lastName: assignment.user.lastName,
    phone: assignment.user.phone,
    organizationId: assignment.user.organizationId,
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
              address: taskData.address || null,
              accuracy: taskData.accuracy || null
            }
          } : {}),
          ...(taskData.metadata || {})
        } as any,
      },
      include: {
        campaign: true,
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    const { status, ...taskWithoutStatus } = task;
    return taskWithoutStatus;
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