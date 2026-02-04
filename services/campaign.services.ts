import { prisma } from '@/lib/prisma';
import type { CreateCampaignInput, CampaignResponse, CampaignStatus } from '@/types/campaign';

interface GetCampaignsParams {
  search?: string;
  status?: CampaignStatus | null;
  serviceType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  organizationId?: string;
  location?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class CampaignService {
  async getCampaigns(params: GetCampaignsParams): Promise<PaginatedResponse<CampaignResponse>> {
    const {
      search = '',
      status = null,
      serviceType = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      organizationId,
      location,
    } = params;    
    const where: any = {organizationId};

    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (location) {
      where.address = { contains: location, mode: 'insensitive' };
    }

    const total = await prisma.campaign.count({ where });

    const campaigns = await prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        members: {
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
        },
        tasks: true,
      },
    });
    return {
      data: campaigns.map(campaign => this.formatCampaignResponse(campaign)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCampaign(data: CreateCampaignInput): Promise<CampaignResponse> {
    const result = await prisma.$transaction(async (prisma) => {
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          organizationId: data.organizationId,
          status: data.status || 'Active',
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          address: data.address,
          serviceType: data.serviceType,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          totalTasks: data.totalTasks || 0,
        },
      });

      return prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          members: {
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
          },
          tasks: true,
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create campaign');
    }

    return this.formatCampaignResponse(result);
  }

  private formatCampaignResponse(campaign: any): CampaignResponse {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      organizationId: campaign.organizationId,
      status: campaign.status as CampaignStatus,
      latitude: campaign.latitude || undefined,
      longitude: campaign.longitude || undefined,
      address: campaign.address || undefined,
      serviceType: campaign.serviceType || undefined,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      totalTasks: campaign.totalTasks,
      members: campaign.members.map((member: any) => ({
        id: member.id,
        campaignId: member.campaignId,
        userId: member.userId,
        assignedBy: member.assignedBy,
        role: member.role as 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER',
        assignedAt: member.assignedAt,
        active: member.active,
        user: member.user ? {
          id: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          phone: member.user.phone,
        } : undefined,
      })),
      tasks: campaign.tasks.map((task: any) => {
        const metadata = (task.metadata as {
          title?: string;
          description?: string;
          dueDate?: string;
          priority?: 'LOW' | 'MEDIUM' | 'HIGH';
        }) || {};

        return {
          id: task.id,
          campaignId: task.campaignId,
          //status: task.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
          executorUserId: task.executorUserId,
          assignedAt: task.assignedAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          //rejectionReason: task.rejectionReason || null,
          flagged: task.flagged,
          notes: task.notes || null,
          metadata: task.metadata || {},
          //title: metadata.title || 'Untitled Task',
          //description: metadata.description || null,
          //dueDate: metadata.dueDate ? new Date(metadata.dueDate) : null,
          //priority: metadata.priority || 'MEDIUM',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          executor: task.executor ? {
            id: task.executor.id,
            firstName: task.executor.firstName,
            lastName: task.executor.lastName,
            phone: task.executor.phone,
          } : null,
        };
      }),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
  async updateCampaignStatus(id: string, status: string): Promise<CampaignResponse> {
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date() 
      },
      include: {
        members: {
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
        },
        tasks: true,
      },
    });

    return this.formatCampaignResponse(updatedCampaign);
  }

  async getCampaignById(id: string, token?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: CampaignResponse | null;
    token?: string;
  }> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          members: {
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
          },
          tasks: {
            include: {
              executor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        return {
          success: false,
          statusCode: 404,
          message: 'Campaign not found',
          data: null
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Campaign retrieved successfully',
        data: this.formatCampaignResponse(campaign),
        token
      };
    } catch (error) {
      console.error('Error in getCampaignById:', error);
      return {
        success: false,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to fetch campaign',
        data: null
      };
    }
  }
async updateCampaign(
  id: string, 
  data: Partial<CreateCampaignInput>
): Promise<CampaignResponse> {
  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: { members: true, tasks: true }
    });

    if (!existingCampaign) {
      throw new Error('Campaign not found');
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      status: data.status,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      serviceType: data.serviceType,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      totalTasks: data.totalTasks,
    };

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        members: {
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
        },
        tasks: true,
      },
    });

    return this.formatCampaignResponse(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}
async deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      throw new Error('Campaign not found');
    }

    await prisma.campaignMember.deleteMany({
      where: { campaignId: id }
    });

    await prisma.task.deleteMany({
      where: { campaignId: id }
    });

    await prisma.campaign.delete({
      where: { id }
    });

    return { 
      success: true, 
      message: 'Campaign deleted successfully' 
    };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete campaign');
  }
}
async addCampaignMembers(
  campaignId: string, 
  members: Array<{ userId: string; role: string }>,
  assignedBy: string
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const userIds = members.map(m => m.userId);
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } }
    });

    if (existingUsers.length !== userIds.length) {
      const existingUserIds = new Set(existingUsers.map(u => u.id));
      const missingUserIds = userIds.filter(id => !existingUserIds.has(id));
      throw new Error(`Users not found: ${missingUserIds.join(', ')}`);
    }

    const existingMembers = await prisma.campaignMember.findMany({
      where: {
        campaignId,
        userId: { in: userIds }
      }
    });

    const existingUserIds = new Set(existingMembers.map(m => m.userId));
    const newMembers = members.filter(m => !existingUserIds.has(m.userId));

    if (newMembers.length === 0) {
      return { 
        success: true, 
        message: 'All users are already members of this campaign',
        addedCount: 0
      };
    }

    const createdMembers = await prisma.$transaction(
      newMembers.map(member => 
        prisma.campaignMember.create({
          data: {
            campaignId,
            userId: member.userId,
            role: member.role as any,
            assignedBy
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        })
      )
    );

    return {
      success: true,
      message: `Successfully added ${createdMembers.length} member(s) to the campaign`,
      addedCount: createdMembers.length,
      members: createdMembers
    };

  } catch (error) {
    console.error('Error adding campaign members:', error);
    throw error;
  }
}
}
