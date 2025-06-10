import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionLimiter, ipLimiter, userLimiter } from './lib/rateLimit';

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get client IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
  
  // Get session ID from cookie or generate one
  const sessionId = request.cookies.get('session_id')?.value || 
    `${ip}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Check IP-based rate limit
  const ipLimit = ipLimiter.check(ip);
  if (!ipLimit.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests from this IP',
        resetTime: ipLimit.resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ipLimit.resetTime.toString(),
        },
      }
    );
  }

  // Check session-based rate limit
  const sessionLimit = sessionLimiter.check(sessionId);
  if (!sessionLimit.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests in this session',
        resetTime: sessionLimit.resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': sessionLimit.resetTime.toString(),
        },
      }
    );
  }

  // If user is authenticated, check user-based rate limit
  const userId = request.cookies.get('user_id')?.value;
  if (userId) {
    const userLimit = userLimiter.check(userId);
    if (!userLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Daily request limit exceeded',
          resetTime: userLimit.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': userLimit.resetTime.toString(),
          },
        }
      );
    }
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', sessionLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', sessionLimit.resetTime.toString());

  // Set session cookie if not present
  if (!request.cookies.has('session_id')) {
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 