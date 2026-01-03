import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: 'colorless',
  });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // URL سے message ID حاصل کریں
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const messageId = parts[parts.length - 1];

    if (!messageId) {
      return NextResponse.json(
        errorResponse('Message ID required'),
        { status: 400 }
      );
    }

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
      successResponse(null, 'پیام حذف شد'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      errorResponse('Server error: ' + String(error).substring(0, 100)),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        errorResponse('Invalid JSON'),
        { status: 400 }
      );
    }
    
    const { content, imageUrl } = body;

    // URL سے message ID حاصل کریں
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const messageId = parts[parts.length - 1];
    
    if (!messageId) {
      return NextResponse.json(
        errorResponse('Message ID required'),
        { status: 400 }
      );
    }

    // بررسی مالکیت پیام
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

    if (message.userId !== payload.userId) {
      return NextResponse.json(
        errorResponse('شما اجازه ویرایش این پیام را ندارید'),
        { status: 403 }
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    if (content !== undefined && content !== null) {
      updateData.content = content;
    }
    if (imageUrl !== undefined && imageUrl !== null) {
      updateData.imageUrl = imageUrl;
    }

    // ویرایش پیام
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
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
    });

    return NextResponse.json(
      successResponse(updatedMessage, 'پیام ویرایش شد'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json(
      errorResponse('Server error: ' + String(error).substring(0, 100)),
      { status: 500 }
    );
  }
}
