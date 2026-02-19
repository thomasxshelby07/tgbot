import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Auth check removed as per user request
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|api|favicon.ico).*)"],
};
