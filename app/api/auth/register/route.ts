import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { hashPassword, comparePasswords } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { isValidEmail, isValidPassword, errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      console.error('Register error: DATABASE_URL is not configured');
      return NextResponse.json(
        errorResponse('پیکربندی دیتابیس ناقص است. متغیر محیطی DATABASE_URL تنظیم نشده است.'),
        { status: 503 }
      );
    }

    const prisma = getPrisma();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        errorResponse('Email و password الزامی هستند'),
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        errorResponse('Email نامعتبر است'),
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        errorResponse('رمز عبور باید حداقل 6 کاراکتر باشد'),
        { status: 400 }
      );
    }

    // بررسی تکراری بودن ایمیل
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        errorResponse('این ایمیل قبلا ثبت‌نام شده است'),
        { status: 409 }
      );
    }

    // هش کردن رمز عبور
    const hashedPassword = await hashPassword(password);

    // ایجاد کاربر جدید
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: body.name || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // تولید token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: (user.role as 'USER' | 'ADMIN') || 'USER',
    });

    return NextResponse.json(
      successResponse({ user, token }, 'ثبت‌نام موفق'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      errorResponse('خطای سرور'),
      { status: 500 }
    );
  }
}
