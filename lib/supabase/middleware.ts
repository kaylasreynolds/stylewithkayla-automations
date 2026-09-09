import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAuthCallback = pathname === "/auth/callback";
  const isDashboard = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api/");

  // Auth callback and API routes (including webhooks) always pass through
  if (isAuthCallback || isApiRoute) {
    return supabaseResponse;
  }

  function redirectWithSession(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;

    const redirectResponse = NextResponse.redirect(url);

    // Preserve the complete refreshed Supabase cookie attributes on redirects.
    // Dropping options such as path, SameSite, expiry, or secure can cause the
    // browser and middleware to disagree about the active session and loop.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  // Redirect logged-in users away from auth pages to dashboard
  if (user && isAuthPage) {
    return redirectWithSession("/dashboard");
  }

  // Redirect unauthenticated users trying to access dashboard to login
  if (!user && isDashboard) {
    return redirectWithSession("/login");
  }

  return supabaseResponse;
}
