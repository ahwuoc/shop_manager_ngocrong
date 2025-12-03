import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/shop/[id] - Get a single shop item with options
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shopItem = await prisma.item_shop.findUnique({
      where: { id: parseInt(id) },
    });

    if (!shopItem) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Shop item not found' },
        { status: 404 }
      );
    }

    // Fetch options
    const options = await prisma.item_shop_option.findMany({
      where: { item_shop_id: parseInt(id) },
    });

    return NextResponse.json({ 
      success: true, 
      data: { ...shopItem, options } 
    });
  } catch (error) {
    console.error('Error fetching shop item:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch shop item' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/[id] - Update a shop item
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.item_shop.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Shop item not found' },
        { status: 404 }
      );
    }

    const updateData: {
      tab_id?: number;
      temp_id?: number;
      gold?: number;
      gem?: number;
      is_new?: boolean;
      is_sell?: boolean;
      item_exchange?: number;
      quantity_exchange?: number;
    } = {};

    if (body.tab_id !== undefined) updateData.tab_id = body.tab_id;
    if (body.temp_id !== undefined) updateData.temp_id = body.temp_id;
    if (body.gold !== undefined) updateData.gold = body.gold;
    if (body.gem !== undefined) updateData.gem = body.gem;
    if (body.is_new !== undefined) updateData.is_new = body.is_new;
    if (body.is_sell !== undefined) updateData.is_sell = body.is_sell;
    if (body.item_exchange !== undefined) updateData.item_exchange = body.item_exchange;
    if (body.quantity_exchange !== undefined) updateData.quantity_exchange = body.quantity_exchange;

    const updated = await prisma.item_shop.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Update options if provided
    if (body.options !== undefined && Array.isArray(body.options)) {
      // Delete existing options
      await prisma.item_shop_option.deleteMany({
        where: { item_shop_id: parseInt(id) },
      });

      // Create new options
      if (body.options.length > 0) {
        await prisma.item_shop_option.createMany({
          data: body.options.map((opt: { option_id: number; param: number }) => ({
            item_shop_id: parseInt(id),
            option_id: opt.option_id,
            param: opt.param,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Shop item updated successfully',
    });
  } catch (error) {
    console.error('Error updating shop item:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to update shop item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shop/[id] - Delete a shop item
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.item_shop.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Shop item not found' },
        { status: 404 }
      );
    }

    // Delete options first
    await prisma.item_shop_option.deleteMany({
      where: { item_shop_id: parseInt(id) },
    });

    await prisma.item_shop.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Shop item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to delete shop item' },
      { status: 500 }
    );
  }
}
