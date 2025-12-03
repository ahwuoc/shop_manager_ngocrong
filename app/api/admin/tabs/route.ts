import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/tabs - Get all shop tabs
export async function GET() {
  try {
    const tabs = await prisma.tab_shop.findMany({
      select: {
        id: true,
        shop_id: true,
        NAME: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tabs,
    });
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch tabs' },
      { status: 500 }
    );
  }
}
