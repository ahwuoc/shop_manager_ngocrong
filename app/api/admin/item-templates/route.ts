import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/item-templates - Get all item templates or specific ones by IDs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const search = searchParams.get('search');

    let where = {};

    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      where = { id: { in: idArray } };
    }

    if (search) {
      // Check if search is a number (ID search)
      const searchId = parseInt(search);
      if (!isNaN(searchId)) {
        // Search by ID or NAME
        where = {
          ...where,
          OR: [
            { id: searchId },
            { NAME: { contains: search } },
          ],
        };
      } else {
        // Search by NAME only
        where = { ...where, NAME: { contains: search } };
      }
    }

    const items = await prisma.item_template.findMany({
      where,
      select: {
        id: true,
        NAME: true,
        TYPE: true,
        icon_id: true,
        description: true,
      },
      orderBy: { NAME: 'asc' },
      take: ids ? undefined : 100,
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching item templates:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch item templates' },
      { status: 500 }
    );
  }
}
