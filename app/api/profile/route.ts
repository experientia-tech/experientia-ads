import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userService } from '@/services/user.services';

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
    const updatedProfile = await userService.updateProfile(authUser.userId, data);

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