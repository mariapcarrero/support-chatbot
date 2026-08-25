/**
 * Verified Cadre AI contact details — the single source of truth.
 *
 * These were placeholders (`cadre.ai/book`, `portal.cadre.ai`, `hello@cadre.ai`) duplicated
 * across tool handlers, knowledge docs, and error messages, so "change it in one place" was
 * not actually true: editing the tool constant left the knowledge base still telling users
 * the old value, and the bot would say two different things depending on whether a tool fired.
 * Everything that states a URL or an address now reads from here.
 *
 * Confirmed against www.cadreai.com on 2026-08-24. Note the email domain is `gocadre.ai`,
 * which is NOT the website domain — do not "correct" it to cadreai.com.
 *
 * Safe to interpolate into knowledge docs: these are build-time constants, so the rendered
 * system prompt stays byte-identical across requests and the prompt cache still hits.
 */

/** The contact form. There is no public scheduling page — see `book-strategy-call.ts`. */
export const CONTACT_URL = "https://www.cadreai.com/contact";

export const CONTACT_EMAIL = "hello@gocadre.ai";

export const WEBSITE_URL = "https://www.cadreai.com";
