import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/shop - List all shop items with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const tabId = searchParams.get('tabId');
    const isSell = searchParams.get('isSell');
    const search = searchParams.get('search');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      tab_id?: number;
      is_sell?: boolean;
      temp_id?: number;
    } = {};

    if (tabId && tabId !== 'all') {
      where.tab_id = parseInt(tabId);
    }

    if (isSell !== null && isSell !== '' && isSell !== 'all') {
      where.is_sell = isSell === 'true';
    }

    if (search) {
      const searchId = parseInt(search);
      if (!isNaN(searchId)) {
        where.temp_id = searchId;
      }
    }

    const [items, total] = await Promise.all([
      prisma.item_shop.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      prisma.item_shop.count({ where }),
    ]);

    // Fetch options for each shop item
    const itemIds = items.map(item => item.id);
    const options = await prisma.item_shop_option.findMany({
      where: { item_shop_id: { in: itemIds } },
    });

    // Group options by item_shop_id
    const optionsByItemId = new Map<number, typeof options>();
    options.forEach(opt => {
      const existing = optionsByItemId.get(opt.item_shop_id) || [];
      existing.push(opt);
      optionsByItemId.set(opt.item_shop_id, existing);
    });

    // Attach options to items
    const itemsWithOptions = items.map(item => ({
      ...item,
      options: optionsByItemId.get(item.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: itemsWithOptions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch shop items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop - Create a new shop item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.tab_id || !body.temp_id) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Tab and Item are required' },
        { status: 400 }
      );
    }



    const shopItem = await prisma.item_shop.create({
      data: {
        tab_id: body.tab_id,
        temp_id: body.temp_id,
        gold: body.gold || 0,
        gem: body.gem || 0,
        is_new: body.is_new ?? true,
        is_sell: body.is_sell ?? true,
        item_exchange: body.item_exchange || -1,
        quantity_exchange: body.quantity_exchange || 0,
      },
    });

    // Create options if provided
    if (body.options && Array.isArray(body.options) && body.options.length > 0) {
      await prisma.item_shop_option.createMany({
        data: body.options.map((opt: { option_id: number; param: number }) => ({
          item_shop_id: shopItem.id,
          option_id: opt.option_id,
          param: opt.param,
        })),
      });
    }

    return NextResponse.json(
      { success: true, data: shopItem, message: 'Shop item created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating shop item:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to create shop item' },
      { status: 500 }
    );
  }
}
