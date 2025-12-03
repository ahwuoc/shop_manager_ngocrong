import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateGiftCode, GiftCodeInput } from '@/app/lib/gift-code-validation';


// GET /api/admin/gift-codes - List all gift codes with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      code?: { contains: string };
      status?: number;
    } = {};

    if (search) {
      where.code = { contains: search };
    }

    if (status !== null && status !== '' && status !== 'all') {
      where.status = parseInt(status);
    }

    const [items, total] = await Promise.all([
      prisma.gift_codes.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.gift_codes.count({ where }),
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedItems = items.map((item: { id: bigint; [key: string]: unknown }) => ({
      ...item,
      id: item.id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: serializedItems,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching gift codes:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to fetch gift codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/gift-codes - Create a new gift code
export async function POST(request: NextRequest) {
  try {
    const body: GiftCodeInput = await request.json();

    // Validate input
    const errors = validateGiftCode(body);
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

    // Check for duplicate code
    const existingCode = await prisma.gift_codes.findFirst({
      where: { code: body.code },
    });

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: 'A gift code with this code already exists',
        },
        { status: 409 }
      );
    }

    // Create gift code
    const giftCode = await prisma.gift_codes.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        gold: body.gold,
        gem: body.gem,
        ruby: body.ruby,
        items: body.items || null,
        status: body.status,
        active: 0,
        expires_at: body.expires_at ? new Date(body.expires_at) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...giftCode, id: giftCode.id.toString() },
        message: 'Gift code created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating gift code:', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_ERROR', message: 'Failed to create gift code' },
      { status: 500 }
    );
  }
}
