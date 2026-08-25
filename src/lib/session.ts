import { cookies } from "next/headers";

export const SESSION_COOKIE = "cadre_sid";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Read the anonymous session id, minting one if absent.
 *
 * This is identity, not authentication — there are no accounts. It exists so a returning
 * visitor keeps their conversation, and so the rate limiter and the conversation
 * ownership check have a stable key.
 *
 * `httpOnly` keeps it out of reach of any script on the page, and `sameSite: lax` means it
 * is not sent on cross-site subrequests, which is what makes the ownership check in
 * `resolveConversation` meaningful.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;

  if (existing && isUuid(existing)) return existing;

  const sessionId = crypto.randomUUID();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return sessionId;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate the cookie value before trusting it.
 *
 * The cookie is client-supplied, and it is used as a rate-limit key and a database value.
 * Constraining it to a UUID means an attacker cannot supply an enormous or crafted string.
 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
