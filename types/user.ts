export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  organizationId: string;
  organizationName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
