import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/accounts - List accounts with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const banFilter = searchParams.get('ban');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      username?: { contains: string };
      ban?: number;
    } = {};

    if (search) {
      where.username = { contains: search };
    }

    if (banFilter !== null && banFilter !== '' && banFilter !== 'all') {
      where.ban = parseInt(banFilter);
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          username: true,
          ban: true,
          is_admin: true,
          vnd: true,
          tongnap: true,
          coin: true,
          create_time: true,
          last_time_login: true,
          ip_address: true,
          email: true,
        },
      }),
      prisma.account.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: accounts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
