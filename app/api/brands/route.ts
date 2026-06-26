import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';

type RequestHandler = (
  request: NextRequest
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const pageVal = searchParams.get('page');
    const limitVal = searchParams.get('limit');
    const page = pageVal ? parseInt(pageVal, 10) : 1;
    const limit = limitVal ? parseInt(limitVal, 10) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: auth.orgId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.brand.count({ where }),
    ]);

    return NextResponse.json(
      response(true, 200, authToken, 'Brands fetched successfully', {
        brands,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      })
    );
  } catch (error) {
    console.error('Error fetching brands:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch brands';
    return NextResponse.json(
      response(false, 500, '', errorMessage),
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const body = await request.json();
    const { name, description, image } = body;

    if (!name) {
      return NextResponse.json(
        response(false, 400, authToken, 'Brand name is required'),
        { status: 400 }
      );
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        image,
        organizationId: auth.orgId,
      },
    });

    return NextResponse.json(
      response(true, 201, authToken, 'Brand created successfully', brand),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating brand:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create brand';
    return NextResponse.json(
      response(false, 500, '', errorMessage),
      { status: 500 }
    );
  }
};
