import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/status.html"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // allow public routes
    if (publicRoutes.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/uploads')) {
        return NextResponse.next();
    }

    const token = request.cookies.get("admin_session");

    // protect dashboard only
    if (!token && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|api|favicon.ico).*)"],
};
