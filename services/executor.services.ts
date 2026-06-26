import { prisma } from '@/lib/prisma';
import { CampaignTaskInput } from '@/types/campaign';

// Prisma unique-constraint violation code; surfaced when concurrent requests
// race to create the same user/campaign member.
const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';

export async function addSupervisor(firstName: string, lastName: string, phone: string, location: string, organizationId: string, campaignId: string, assignedBy: string) {
  try {
    // Run user upsert + membership creation atomically so a failure can't leave an orphan user.
    const campaignMember = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { phone },
        include: {
          campaignMembers: {
            where: {
              role: 'SUPERVISOR',
              active: true,
            },
          },
        },
      });

      let user;

      if (existingUser) {
        if (existingUser.campaignMembers.length > 0) {
          throw new Error('User with this phone number is already a supervisor');
        }

        user = await tx.user.update({
          where: { id: existingUser.id },
          data: { firstName, lastName, organizationId },
          select: { id: true },
        });
      } else {
        user = await tx.user.create({
          data: { firstName, lastName, phone, organizationId },
          select: { id: true },
        });
      }

      return tx.campaignMember.create({
        data: {
          campaignId,
          userId: user.id,
          assignedBy,
          role: 'SUPERVISOR',
          location,
        },
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
    });

    return {
      id: campaignMember.user.id,
      firstName: campaignMember.user.firstName,
      lastName: campaignMember.user.lastName,
      phone: campaignMember.user.phone,
      organizationId: campaignMember.user.organizationId,
      location: campaignMember.location,
      role: 'SUPERVISOR',
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error('User with this phone number is already a supervisor');
    }
    throw error;
  }
}

export async function addExecutor(firstName: string, lastName: string, phone: string, location: string, organizationId: string, campaignId: string, assignedBy: string) {
  try {
    // Run user upsert + membership creation atomically so a failure can't leave an orphan user.
    const campaignMember = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      let user;

      if (existingUser) {
        // Executors may be assigned to multiple campaigns.
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: { firstName, lastName, organizationId },
          select: { id: true },
        });
      } else {
        user = await tx.user.create({
          data: { firstName, lastName, phone, organizationId },
          select: { id: true },
        });
      }

      return tx.campaignMember.create({
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
            },
          },
        },
      });
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
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Same executor already assigned to this campaign (campaignId+userId+role unique).
      throw new Error('This executor is already assigned to this campaign');
    }
    throw error;
  }
}

export async function getAllExecutors(organizationId?: string, executorId?: string, search?: string, page?: number, limit?: number) {
  const executorAssignments = await prisma.campaignMember.findMany({
    where: {
      role: 'EXECUTOR',
      active: true,
      ...(organizationId && {
        user: {
          organizationId: organizationId
        }
      }),
      ...(executorId && {
        userId: executorId
      }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
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
    take: limit,
    skip: page && limit ? (page - 1) * limit : undefined,
  });

  return executorAssignments.map((assignment) => ({
    id: assignment.userId,
    firstName: assignment.user.firstName,
    lastName: assignment.user.lastName,
    phone: assignment.user.phone,
    organizationId: assignment.user.organizationId,
    role: 'EXECUTOR',
    location: assignment.location,
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
        notes: taskData.notes || null,
        status: 'ACCEPTED',
        completedAt: new Date(),
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