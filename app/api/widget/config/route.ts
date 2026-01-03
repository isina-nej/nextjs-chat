import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    successResponse({
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      endpoints: {
        getMessages: '/api/widget/messages',
        postMessage: '/api/widget/messages',
      },
      requirements: {
        apiKey: 'Required in x-api-key header',
        methods: {
          GET: 'Fetch all messages',
          POST: 'Post new message from widget',
        },
      },
      example: {
        postMessage: {
          method: 'POST',
          url: '/api/widget/messages',
          headers: {
            'x-api-key': 'your-api-key',
            'Content-Type': 'application/json',
          },
          body: {
            content: 'پیام از سایت خارجی',
            guestEmail: 'guest@example.com',
          },
        },
      },
    })
  );
}
