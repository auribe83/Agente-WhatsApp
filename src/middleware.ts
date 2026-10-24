import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "atiende_super_secret_jwt_key_at_least_32_chars_long_2026"
);

const PUBLIC_PATHS = [
  "/login",
  "/demo",
  "/widget.js",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/chat/widget",
  "/api/channels/whatsapp/sse",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir archivos estáticos de Next.js y rutas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/chat") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("atiende_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, SECRET_KEY);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
