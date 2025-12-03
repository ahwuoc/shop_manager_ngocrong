import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/admin/milestones - List all milestones
export async function GET() {
  try {
    const milestones = await prisma.moc_nap.findMany({
      orderBy: { required: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

// POST /api/admin/milestones - Create a new milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required field
    if (!body.required || body.required <= 0) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Required amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check for duplicate threshold
    const existing = await prisma.moc_nap.findFirst({
      where: { required: body.required },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'DUPLICATE_ENTRY', message: 'A milestone with this threshold already exists' },
        { status: 409 }
      );
    }

    const milestone = await prisma.moc_nap.create({
      data: {
        required: body.required,
        descriptor: body.descriptor || null,
        rewards: body.rewards ? JSON.stringify(body.rewards) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: milestone, message: 'Milestone created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}
