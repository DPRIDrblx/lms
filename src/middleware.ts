import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
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

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  // Bypass for static assets and public routes
  if (isAuthPage) return supabaseResponse;

  // Leniency: Check if session cookies exist before hitting Supabase
  // This helps break the redirect loop if cookies are still being propagated
  const hasAccessToken = request.cookies.has("sb-access-token");
  const hasRefreshToken = request.cookies.has("sb-refresh-token");

  console.log('Middleware Check:', { 
    path: request.nextUrl.pathname, 
    hasAccessToken, 
    hasRefreshToken 
  });

  // EMERGENCY BYPASS: If tokens exist, trust the browser for a moment 
  // to allow client-side AuthProvider to take over
  if (hasAccessToken) {
    return supabaseResponse;
  }

  // Final check: Validate with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // If we're here, it means NO access token exists OR getUser failed definitively
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (error) url.searchParams.set("error", "session_expired");
    
    const response = NextResponse.redirect(url);
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|models|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
