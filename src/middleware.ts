import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect all /dashboard, /agents, /swarms, etc. routes
  const isAppRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/agents') ||
    request.nextUrl.pathname.startsWith('/swarms') ||
    request.nextUrl.pathname.startsWith('/workflows') ||
    request.nextUrl.pathname.startsWith('/pipeline') ||
    request.nextUrl.pathname.startsWith('/automations') ||
    request.nextUrl.pathname.startsWith('/marketplace') ||
    request.nextUrl.pathname.startsWith('/integrations') ||
    request.nextUrl.pathname.startsWith('/terminal') ||
    request.nextUrl.pathname.startsWith('/workspace') ||
    request.nextUrl.pathname.startsWith('/deployments') ||
    request.nextUrl.pathname.startsWith('/logs') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/billing') ||
    request.nextUrl.pathname.startsWith('/api-keys') ||
    request.nextUrl.pathname.startsWith('/team') ||
    request.nextUrl.pathname.startsWith('/settings');

  if (!user && isAppRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Already logged in — redirect away from auth pages
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
