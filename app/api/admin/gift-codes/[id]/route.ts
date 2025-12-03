import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

interface GiftCodeUpdateInput {
  code?: string;
  type?: number;
  gold?: number;
  gem?: number;
  ruby?: number;
  items?: string | null;
  status?: number;
  expires_at?: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateGiftCodeUpdate(data: GiftCodeUpdateInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Code validation if provided
  if (data.code !== undefined) {
    if (data.code.trim() === '') {
      errors.push({ field: 'code', message: 'Code cannot be empty' });
    } else if (data.code.length < 6 || data.code.length > 20) {
      errors.push({ field: 'code', message: 'Code must be between 6 and 20 characters' });
    } else if (!/^[A-Za-z0-9]+$/.test(data.code)) {
      errors.push({ field: 'code', message: 'Code must be alphanumeric only' });
    }
  }

  // Type validation if provided
  if (data.type !== undefined && data.type !== 0 && data.type !== 1) {
    errors.push({ field: 'type', message: 'Type must be 0 (single-use) or 1 (multi-use)' });
  }

  // Numeric validations if provided
  if (data.gold !== undefined && data.gold < 0) {
    errors.push({ field: 'gold', message: 'Gold must be non-negative' });
  }
  if (data.gem !== undefined && data.gem < 0) {
    errors.push({ field: 'gem', message: 'Gem must be non-negative' });
  }
  if (data.ruby !== undefined && data.ruby < 0) {
    errors.push({ field: 'ruby', message: 'Ruby must be non-negative' });
  }

  // Status validation if provided
  if (data.status !== undefined && data.status !== 0 && data.status !== 1) {
    errors.push({ field: 'status', message: 'Status must be 0 (inactive) or 1 (active)' });
  }

  // Expiry date validation if provided
  if (data.expires_at !== undefined && data.expires_at !== null) {
    const expiryDate = new Date(data.expires_at);
    if (isNaN(expiryDate.getTime())) {
      errors.push({ field: 'expires_at', message: 'Invalid expiry date format' });
    } else if (expiryDate <= new Date()) {
      errors.push({ field: 'expires_at', message: 'Expiry date must be in the future' });
    }
  }

  return errors;
}


type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/gift-codes/[id] - Get a single gift code
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const giftCode = await prisma.gift_codes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!giftCode) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Gift code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...giftCode, id: giftCode.id.toString() },
    });
  } catch (error) {
    console.error('Error fetching gift code:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch gift code' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/gift-codes/[id] - Update a gift code
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: GiftCodeUpdateInput = await request.json();

    // Check if gift code exists
    const existingGiftCode = await prisma.gift_codes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingGiftCode) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Gift code not found' },
        { status: 404 }
      );
    }

    // Validate input
    const errors = validateGiftCodeUpdate(body);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.reduce((acc, err) => {
            acc[err.field] = [err.message];
            return acc;
          }, {} as Record<string, string[]>),
        },
        { status: 400 }
      );
    }

    // Check for duplicate code if code is being changed
    if (body.code) {
      const newCode = body.code.toUpperCase();
      // Only check for duplicates if the code is actually different
      if (newCode !== existingGiftCode.code.toUpperCase()) {
        const duplicateCode = await prisma.gift_codes.findFirst({
          where: { 
            code: newCode,
            id: { not: BigInt(id) } // Exclude current record
          },
        });

        if (duplicateCode) {
          return NextResponse.json(
            {
              success: false,
              error: 'DUPLICATE_ENTRY',
              message: 'A gift code with this code already exists',
            },
            { status: 409 }
          );
        }
      }
    }

    // Build update data
    const updateData: {
      code?: string;
      type?: number;
      gold?: number;
      gem?: number;
      ruby?: number;
      items?: string | null;
      status?: number;
      expires_at?: Date | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.gold !== undefined) updateData.gold = body.gold;
    if (body.gem !== undefined) updateData.gem = body.gem;
    if (body.ruby !== undefined) updateData.ruby = body.ruby;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expires_at !== undefined) {
      updateData.expires_at = body.expires_at ? new Date(body.expires_at) : null;
    }

    const updatedGiftCode = await prisma.gift_codes.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { ...updatedGiftCode, id: updatedGiftCode.id.toString() },
      message: 'Gift code updated successfully',
    });
  } catch (error) {
    console.error('Error updating gift code:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to update gift code' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gift-codes/[id] - Delete a gift code
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if gift code exists
    const existingGiftCode = await prisma.gift_codes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingGiftCode) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Gift code not found' },
        { status: 404 }
      );
    }

    // Delete related history records first
    await prisma.gift_code_histories.deleteMany({
      where: { gift_code_id: BigInt(id) },
    });

    // Delete the gift code
    await prisma.gift_codes.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Gift code deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting gift code:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to delete gift code' },
      { status: 500 }
    );
  }
}
