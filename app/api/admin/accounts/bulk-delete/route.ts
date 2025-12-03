import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// POST /api/admin/accounts/bulk-delete - Delete multiple accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'No account IDs provided' },
        { status: 400 }
      );
    }

    // Delete related players first
    await prisma.player.deleteMany({
      where: { account_id: { in: ids } },
    });

    // Delete accounts
    const result = await prisma.account.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} account(s) deleted successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting accounts:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to delete accounts' },
      { status: 500 }
    );
  }
}
