import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const MESSAGES_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      console.error('Get messages error: DATABASE_URL is not configured');
      return NextResponse.json(
        errorResponse('پیکربندی دیتابیس ناقص است. متغیر محیطی DATABASE_URL تنظیم نشده است.'),
        { status: 503 }
      );
    }

    const prisma = getPrisma();
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        errorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * MESSAGES_PER_PAGE;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: MESSAGES_PER_PAGE,
      }),
      prisma.message.count(),
    ]);

    return NextResponse.json(
      successResponse({
        messages: messages.reverse(),
        pagination: {
          page,
          perPage: MESSAGES_PER_PAGE,
          total,
          pages: Math.ceil(total / MESSAGES_PER_PAGE),
        },
      })
    );
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        errorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        errorResponse('Content یا imageUrl الزامی است'),
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content: content || null,
        imageUrl: imageUrl || null,
        userId: payload.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      successResponse(message, 'پیام با موفقیت ارسال شد'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}
