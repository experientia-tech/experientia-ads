import { prisma } from '@/lib/prisma';
import type { CreateCampaignInput, CampaignResponse, CampaignStatus } from '@/types/campaign';

interface GetCampaignsParams {
  search?: string;
  status?: CampaignStatus | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;    
    const where: any = {};
    
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

    // Get total count for pagination
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

    // Format the response
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
      const taskCount = data.totalTasks !== undefined ? data.totalTasks : (data.tasks?.length || 0);
      
      // 1. Create the campaign
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
          status: data.status || 'Active',
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          serviceType: data.serviceType,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          totalTasks: taskCount,
        },
      });

      // 2. Add campaign members
      if (data.members && data.members.length > 0) {
        await Promise.all(
          data.members.map(member => 
            prisma.campaignMember.create({
              data: {
                campaignId: campaign.id,
                userId: member.userId,
                assignedBy: member.userId,
                role: member.role,
              },
            })
          )
        );
      }
      
      if (data.tasks && data.tasks.length > 0) {
        await Promise.all(
          data.tasks.map(task => 
            prisma.task.create({
              data: {
                campaignId: campaign.id,
                status: task.status || 'PENDING',
                executorUserId: task.executorUserId,
                assignedAt: new Date(),
                metadata: {
                  title: task.title,
                  description: task.description,
                  dueDate: task.dueDate,
                  priority: task.priority || 'MEDIUM',
                }
              },
            })
          )
        );
      }

      // 4. Fetch the campaign with all its relations
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
          status: task.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
          executorUserId: task.executorUserId,
          assignedAt: task.assignedAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          rejectionReason: task.rejectionReason || null,
          flagged: task.flagged,
          notes: task.notes || null,
          metadata: task.metadata || {},
          title: metadata.title || 'Untitled Task',
          description: metadata.description || null,
          dueDate: metadata.dueDate ? new Date(metadata.dueDate) : null,
          priority: metadata.priority || 'MEDIUM',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      }),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
  async getCampaignById(id: string): Promise<CampaignResponse | null> {
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
        tasks: true,
      },
    });

    if (!campaign) {
      return null;
    }

    return this.formatCampaignResponse(campaign);
  } catch (error) {
    console.error('Error in getCampaignById:', error);
    throw error;
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
}
