import Anthropic from "@anthropic-ai/sdk";

/**
 * Model provider selection.
 *
 * The app speaks the Anthropic Messages API. OpenRouter exposes that same API natively at
 * `/api/v1/messages` — content blocks, `stop_reason`, and crucially the `cache_control` /
 * `cache_read_input_tokens` surface the whole design depends on. So switching providers is
 * a base URL, an auth scheme, and a model-id prefix. No second code path, no request
 * translation layer, and the same official SDK either way.
 *
 * This mirrors what Cadre AI tells clients about avoiding lock-in (see the
 * `security-and-llm-selection` knowledge doc): keep prompts, tools, and evaluations in your
 * own codebase so changing provider is configuration rather than a rewrite.
 *
 * Set `LLM_PROVIDER=openrouter` to switch. Everything else is unchanged.
 */
export type Provider = "anthropic" | "openrouter";

/**
 * Note the missing `/v1`. The SDK appends `/v1/messages` to the base URL itself, so the
 * documented endpoint `https://openrouter.ai/api/v1/messages` is reached from a base of
 * `https://openrouter.ai/api`. Including the `/v1` here produces `/api/v1/v1/messages`,
 * which OpenRouter answers with a 404 HTML page rather than a JSON error.
 */
const OPENROUTER_BASE_URL = "https://openrouter.ai/api";

export function getProvider(): Provider {
  return process.env.LLM_PROVIDER === "openrouter" ? "openrouter" : "anthropic";
}

export class MissingApiKeyError extends Error {
  constructor(provider: Provider) {
    const variable = provider === "openrouter" ? "OPENROUTER_API_KEY" : "ANTHROPIC_API_KEY";
    super(
      `${variable} is not set (LLM_PROVIDER=${provider}). Add it to .env.local locally, or to the project environment variables on Vercel.`,
    );
    this.name = "MissingApiKeyError";
  }
}

/**
 * OpenRouter namespaces model ids by vendor; the first-party API does not.
 * `claude-sonnet-5` -> `anthropic/claude-sonnet-5`.
 *
 * Kept as a pure function so `config.ts` can hold one canonical id per workload and neither
 * the agent nor the judge has to know which provider is active.
 */
export function resolveModel(model: string, provider: Provider = getProvider()): string {
  if (provider !== "openrouter") return model;
  return model.includes("/") ? model : `anthropic/${model}`;
}

// Memoized per provider so a changed LLM_PROVIDER cannot hand back a stale client.
const clients = new Map<Provider, Anthropic>();

export function getAnthropicClient(): Anthropic {
  const provider = getProvider();

  const cached = clients.get(provider);
  if (cached) return cached;

  const client =
    provider === "openrouter" ? createOpenRouterClient() : createFirstPartyClient();

  clients.set(provider, client);
  return client;
}

function createFirstPartyClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingApiKeyError("anthropic");
  return new Anthropic({ maxRetries: 2 });
}

function createOpenRouterClient(): Anthropic {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new MissingApiKeyError("openrouter");

  return new Anthropic({
    baseURL: OPENROUTER_BASE_URL,
    // OpenRouter authenticates with `Authorization: Bearer`, not `x-api-key`. `authToken`
    // is the SDK's supported way to send that — do not pass the key as `apiKey`.
    authToken: key,
    apiKey: null,
    maxRetries: 2,
    defaultHeaders: {
      // Optional OpenRouter attribution; shows up in their dashboard.
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Cadre AI Support Chatbot",
    },
  });
}

/** Test seam: drop memoized clients so a changed env var takes effect. */
export function resetAnthropicClient(): void {
  clients.clear();
}
