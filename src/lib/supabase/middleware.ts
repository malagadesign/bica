import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAccessAllowed } from "@/lib/auth/profile";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

type ProfileAccess = {
  role: string;
  access_status: string;
  access_expires_at: string | null;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
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

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isAppRoute = pathname.startsWith("/app");
  const isAccessDisabledRoute = pathname === "/access-disabled";
  const isAdminRoute = pathname.startsWith("/app/admin");
  const isHelpAdminRoute = pathname.startsWith("/app/help/admin");
  const isInternalQaRoute = pathname.startsWith("/app/search/qa");

  if (!user && (isAppRoute || isAccessDisabledRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (isAppRoute) {
      url.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(url);
  }

  let profile: ProfileAccess | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, access_status, access_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    profile = data as ProfileAccess | null;
  }

  const accessOk =
    profile != null &&
    isAccessAllowed({
      access_status: profile.access_status as "active" | "suspended" | "pending",
      access_expires_at: profile.access_expires_at,
    });

  if (user && isAppRoute) {
    if (!accessOk) {
      const url = request.nextUrl.clone();
      url.pathname = "/access-disabled";
      return NextResponse.redirect(url);
    }

    if ((isAdminRoute || isHelpAdminRoute) && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = isHelpAdminRoute ? "/app/help" : "/app/dashboard";
      return NextResponse.redirect(url);
    }

    if (isInternalQaRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAccessDisabledRoute && accessOk) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = accessOk ? "/app/dashboard" : "/access-disabled";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
