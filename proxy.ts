import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isRussianPublicPath = pathname === '/ru' || pathname.startsWith('/ru/');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-expert-locale', isRussianPublicPath ? 'ru' : 'es');

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Russian public routes only need the locale marker here. Avoid an
  // unnecessary Supabase Auth round-trip for unauthenticated public pages.
  if (isRussianPublicPath) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // getUser() re-validates JWT with Supabase Auth server on each request
  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthPath = pathname === '/auth/login' || pathname === '/auth/signup';

  if (user && (isProtectedPath || isAuthPath)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.status === 'inactive') {
      if (isProtectedPath) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('error', 'inactive');
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }
  }

  // Redirect authenticated users away from auth pages while preserving a safe
  // internal destination supplied by commercial/onboarding links.
  if (user && isAuthPath) {
    const requestedNext = request.nextUrl.searchParams.get('next')?.trim() ?? '';
    const safeNext = requestedNext.startsWith('/')
      && !requestedNext.startsWith('//')
      && !requestedNext.includes('\\')
      ? requestedNext
      : '/dashboard';
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // Protect /dashboard and /admin — admin role check is in app/(protected)/admin/layout.tsx
  if (!user && isProtectedPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // /docs/laboral is included so a request there also refreshes/persists a
  // rotated Supabase session cookie (getUser() above) — it does not become
  // a protected path: isProtectedPath/isAuthPath don't match it, so no
  // redirect logic runs for it here; per-article access is enforced in
  // lib/utils/academy-enrollment.ts instead, since the public index article
  // must stay reachable without a session.
  matcher: ['/ru', '/ru/:path*', '/dashboard/:path*', '/admin/:path*', '/auth/login', '/auth/signup', '/docs/laboral/:path*']
};
