import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate on /admin.
 *
 * The ops inbox lists contact details captured from real visitors and offers a delete and a
 * clear-all button, so it cannot be a public URL. Basic auth is enough here: this is a demo
 * surface for one person, the credential is a single shared secret, and the alternative —
 * a login page, sessions, a user table — is a login system nobody asked for.
 *
 * **Fails closed.** With no ADMIN_PASSWORD set, /admin is blocked in production and left open
 * in local development. A missing environment variable is the likeliest way this gets
 * misconfigured, and the safe reading of "the password is missing" is no access, not free
 * access. Locally there is nothing to protect and demanding a password would just be friction.
 *
 * Server actions POST back to the route they came from, so matching /admin covers the delete
 * and clear buttons too, not only the page render.
 */
export function middleware(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      // Deliberately 404 rather than 503: a "service unavailable" tells a stranger that
      // something is here and misconfigured. Not found tells them nothing.
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    // atob, not Buffer — middleware runs on the edge runtime.
    let decoded = "";
    try {
      decoded = atob(header.slice("Basic ".length));
    } catch {
      decoded = "";
    }
    // Everything after the first colon: passwords may legitimately contain one.
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (decoded.includes(":") && constantTimeEquals(password, expected)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Cadre AI ops inbox", charset="UTF-8"' },
  });
}

/**
 * Compares without returning early on the first differing byte.
 *
 * `crypto.timingSafeEqual` is not available in the edge runtime. The length check leaks the
 * length, which is an acceptable trade for a shared demo secret.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
