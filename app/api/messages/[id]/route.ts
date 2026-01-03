import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function DELETE(
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

    const messageId = params.id;

    // بررسی مالکیت پیام یا ادمین بودن کاربر
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { userId: true },
    });

    if (!message) {
      return NextResponse.json(
        errorResponse('پیام یافت نشد'),
        { status: 404 }
      );
    }

    if (message.userId !== payload.userId && payload.role !== 'ADMIN') {
      return NextResponse.json(
        errorResponse('شما اجازه حذف این پیام را ندارید'),
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json(
      successResponse(null, 'پیام حذف شد')
    );
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      errorResponse('Server error'),
      { status: 500 }
    );
  }
}
