import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    // در یک سیستم واقعی، API key باید در دیتابیس بررسی شود
    if (!apiKey) {
      return NextResponse.json(
        errorResponse('API key required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const messages = await prisma.message.findMany({
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(
      successResponse({
        messages: messages.reverse(),
        count: messages.length,
      })
    );
  } catch (error) {
    console.error('Widget get messages error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        errorResponse('API key required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, guestEmail } = body;

    if (!content || !guestEmail) {
      return NextResponse.json(
        errorResponse('content و guestEmail الزامی هستند'),
        { status: 400 }
      );
    }

    // ایجاد یک کاربر مهمان یا استفاده از کاربر موجود
    let user = await prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: guestEmail,
          password: 'widget-guest', // password hash نشده برای مهمانان
          name: 'مهمان',
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      successResponse(message, 'پیام با موفقیت ثبت شد'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Widget post message error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}
