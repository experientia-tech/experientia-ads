import { prisma } from '@/lib/prisma';
import type { CampaignRole } from '@prisma/client';

export class CampaignMemberService {
  async getCampaignMembers(filters: {
    campaignId?: string;
    userId?: string;
    role?: CampaignRole;
  }) {
    const where: any = {};
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.role) where.role = filters.role;

    const members = await prisma.campaignMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    // Transform the response to flatten the user object
    return members.map(member => ({
      id: member.id,
      campaignId: member.campaignId,
      userId: member.userId,
      assignedBy: member.assignedBy,
      role: member.role,
      assignedAt: member.assignedAt,
      active: member.active,
      // Flatten user fields
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      phone: member.user.phone,
      // Include campaign info
      campaignName: member.campaign?.name
    }));
  }

  async addCampaignMember(params: {
    campaignId: string;
    userId: string;
    role: CampaignRole;
    assignedBy: string;
  }) {
    const { campaignId, userId, role, assignedBy } = params;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingMember = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this campaign');
    }

    return prisma.campaignMember.create({
      data: {
        campaignId,
        userId,
        role,
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
    });
  }

  async removeCampaignMember(memberId: string) {
    const member = await prisma.campaignMember.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      throw new Error('Campaign member not found');
    }

    return prisma.campaignMember.delete({
      where: { id: memberId }
    });
  }

  async updateCampaignMemberRole(memberId: string, role: CampaignRole) {
    const member = await prisma.campaignMember.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      throw new Error('Campaign member not found');
    }

    return prisma.campaignMember.update({
      where: { id: memberId },
      data: { role }
    });
  }
}

export const campaignMemberService = new CampaignMemberService();