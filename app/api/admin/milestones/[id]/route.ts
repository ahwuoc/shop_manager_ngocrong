import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/milestones/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const milestone = await prisma.moc_nap.findUnique({
      where: { id: parseInt(id) },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Milestone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: milestone });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch milestone' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/milestones/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.moc_nap.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check for duplicate threshold if changing
    if (body.required && body.required !== existing.required) {
      const duplicate = await prisma.moc_nap.findFirst({
        where: { required: body.required },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'DUPLICATE_ENTRY', message: 'A milestone with this threshold already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: {
      required?: number;
      descriptor?: string | null;
      rewards?: string | null;
    } = {};

    if (body.required !== undefined) updateData.required = body.required;
    if (body.descriptor !== undefined) updateData.descriptor = body.descriptor;
    if (body.rewards !== undefined) updateData.rewards = body.rewards ? JSON.stringify(body.rewards) : null;

    const updated = await prisma.moc_nap.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/milestones/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.moc_nap.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Delete claimed records first
    await prisma.mocnap_claimed.deleteMany({
      where: { mocnap_id: parseInt(id) },
    });

    await prisma.moc_nap.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to delete milestone' },
      { status: 500 }
    );
  }
}
