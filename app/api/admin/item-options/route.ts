import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/item-options - Get all item option templates
export async function GET() {
  try {
    const options = await prisma.item_option_template.findMany({
      select: {
        id: true,
        NAME: true,
        TYPE: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Error fetching item options:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch item options' },
      { status: 500 }
    );
  }
}
