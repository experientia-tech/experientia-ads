import { prisma } from '@/lib/prisma';
import type { ProfileResponse, UpdateProfileInput } from '@/types/user';

export class UserService {
  async getProfile(userId: string): Promise<ProfileResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<ProfileResponse> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date()
      },
    });

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt,
      organizationId: updatedUser.organizationId,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}

export const userService = new UserService();