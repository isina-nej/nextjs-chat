import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        errorResponse('Forbidden - Admin only'),
        { status: 403 }
      );
    }

    const userId = params.id;
    const { isActive } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      successResponse(updatedUser, 'کاربر با موفقیت به‌روز شد')
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}
