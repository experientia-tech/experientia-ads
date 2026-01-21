import { prisma } from '@/lib/prisma';

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