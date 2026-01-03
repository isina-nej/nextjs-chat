import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
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

    // بررسی ادمین بودن
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        errorResponse('Forbidden - Admin only'),
        { status: 403 }
      );
    }

    const [totalUsers, activeUsers, totalMessages, messagesLastDay] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { isActive: true },
      }),
      prisma.message.count(),
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json(
      successResponse({
        totalUsers,
        activeUsers,
        totalMessages,
        messagesLastDay,
        stats: [
          { label: 'کل کاربران', value: totalUsers },
          { label: 'کاربران فعال', value: activeUsers },
          { label: 'کل پیام‌ها', value: totalMessages },
          { label: 'پیام‌های امروز', value: messagesLastDay },
        ],
      })
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}
