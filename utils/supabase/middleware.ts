import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Add user checking logic here
  const { data: { user } } = await supabase.auth.getUser();

  const internalRoutes = [
    "/dashboard",
    "/projects",
    "/time-log",
    "/users",
    "/resource-mgmt",
    "/reports",
    "/settings"
  ];

  const isInternal = internalRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!user && isInternal) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
};
