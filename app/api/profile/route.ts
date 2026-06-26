import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userService } from '@/services/user.services';
import type { UpdateProfileInput } from '@/types/user';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await userService.getProfile(authUser.userId);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Whitelist updatable fields so callers can't write arbitrary columns
    // (e.g. organizationId, phone, isActive) via the profile endpoint.
    const updateData: UpdateProfileInput = {};
    if (typeof data.firstName === 'string') updateData.firstName = data.firstName;
    if (typeof data.lastName === 'string') updateData.lastName = data.lastName;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedProfile = await userService.updateProfile(authUser.userId, updateData);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}