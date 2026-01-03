import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePasswords } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { isValidEmail, errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
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

    // جستجو برای کاربر
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        errorResponse('کاربر یا رمز عبور نادرست است'),
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        errorResponse('این حساب کاربری غیرفعال است'),
        { status: 403 }
      );
    }

    // بررسی رمز عبور
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        errorResponse('کاربر یا رمز عبور نادرست است'),
        { status: 401 }
      );
    }

    // تولید token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      successResponse({ user: userWithoutPassword, token }, 'ورود موفق'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      errorResponse('خطای سرور'),
      { status: 500 }
    );
  }
}
