import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// Helper to convert BigInt to Number for JSON serialization
function serializeAccount(account: Record<string, unknown>) {
  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(account)) {
    serialized[key] = typeof value === 'bigint' ? Number(value) : value;
  }
  return serialized;
}

// GET /api/admin/accounts/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const account = await prisma.account.findUnique({
      where: { id: parseInt(id) },
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
        last_time_logout: true,
        ip_address: true,
        email: true,
        gmail: true,
        tichdiem: true,
        server_login: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeAccount(account as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/accounts/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.account.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    const updateData: {
      ban?: number;
      is_admin?: boolean;
      vnd?: number;
      coin?: number;
      tongnap?: number;
      tichdiem?: number;
    } = {};

    if (body.ban !== undefined) updateData.ban = body.ban;
    if (body.is_admin !== undefined) updateData.is_admin = body.is_admin;
    if (body.vnd !== undefined) updateData.vnd = body.vnd;
    if (body.coin !== undefined) updateData.coin = body.coin;
    if (body.tongnap !== undefined) updateData.tongnap = body.tongnap;
    if (body.tichdiem !== undefined) updateData.tichdiem = body.tichdiem;

    const updated = await prisma.account.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: serializeAccount(updated as unknown as Record<string, unknown>),
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to update account' },
      { status: 500 }
    );
  }
}


// DELETE /api/admin/accounts/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.account.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    // Delete related player first
    await prisma.player.deleteMany({
      where: { account_id: parseInt(id) },
    });

    await prisma.account.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
