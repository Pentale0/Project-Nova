/**
 * Model providers for PROJECT NOVA's AI coaches.
 *
 * Two backends, chosen by which key is present in the environment:
 *   - OpenRouter (preferred): OpenAI-compatible /chat/completions, so plain
 *     fetch is enough and no extra dependency is needed.
 *   - Google Gemini: reached through the official @google/genai SDK.
 *
 * Both expose the same tiny surface: generate(prompt) -> raw text. The caller
 * owns JSON extraction and validation, so swapping providers never changes the
 * shape of a response.
 *
 * Keys are read from env only and never returned to the browser.
 *
 * The Gemini SDK is loaded with a dynamic import rather than a static one. That
 * SDK and its auth/websocket tree come to ~1.7 MB, and a static import would
 * place all of it in every Vercel function bundle -- including OpenRouter
 * deployments, which never call it. Loading on first use keeps those bundles
 * small and cold starts fast.
 */

export interface Provider {
  /** Human-readable provider id for /api/health. */
  name: 'openrouter' | 'gemini';
  /** Model identifier as the provider expects it. */
  model: string;
  /** Whether a key was found for this provider. */
  configured: boolean;
  generate(prompt: string): Promise<string>;
}

const DEFAULT_OPENROUTER_MODEL = 'inclusionai/ling-3.0-flash';
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Thrown for failures that are the caller's problem (bad key, unknown model).
 * Transient capacity errors are thrown as plain Errors so generateWithRetry's
 * `isTransient` check can recognise them.
 */
export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}

// ---------------------------------------------------------------------------
// OpenRouter
// ---------------------------------------------------------------------------

function createOpenRouterProvider(apiKey: string): Provider {
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;

  return {
    name: 'openrouter',
    model,
    configured: true,

    async generate(prompt: string): Promise<string> {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      // Optional attribution headers; OpenRouter uses them for its dashboard.
      if (process.env.OPENROUTER_SITE_URL) {
        headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
      }
      if (process.env.OPENROUTER_APP_TITLE) {
        headers['X-Title'] = process.env.OPENROUTER_APP_TITLE;
      }

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          // Ask for machine-readable output. Not every upstream model honours
          // this, so extractJson in index.ts remains the safety net.
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        // Include the status in the message so isTransient() can classify it.
        const body = await response.text().catch(() => '');
        throw new Error(
          `OpenRouter HTTP ${response.status}: ${body.slice(0, 400)}`
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new Error('OpenRouter returned an empty completion');
      }
      return text;
    },
  };
}

// ---------------------------------------------------------------------------
// Google Gemini
// ---------------------------------------------------------------------------

/**
 * The SDK's client, created on first use and kept for the process lifetime.
 * Typed structurally so nothing is imported at module scope.
 */
interface GeminiClient {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config?: Record<string, unknown>;
    }): Promise<{ text?: string | null }>;
  };
}

let geminiClient: GeminiClient | null = null;

/** Resolves the SDK constructor once, memoised across calls. */
let geminiCtor: Promise<new (opts: unknown) => GeminiClient> | null = null;

async function loadGemini(): Promise<new (opts: unknown) => GeminiClient> {
  if (!geminiCtor) {
    // The specifier is a variable so bundlers leave it alone and the ~1.7 MB
    // SDK stays out of the bundle until this line actually executes.
    const specifier = '@google/genai';
    geminiCtor = import(/* @vite-ignore */ specifier).then(
      (mod) => (mod as { GoogleGenAI: new (opts: unknown) => GeminiClient }).GoogleGenAI
    );
  }
  return geminiCtor;
}

function createGeminiProvider(apiKey: string): Provider {
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  // Optional override for gateways/proxies that front the Gemini API.
  const baseUrl = process.env.GEMINI_BASE_URL?.trim();

  return {
    name: 'gemini',
    model,
    configured: true,

    async generate(prompt: string): Promise<string> {
      if (!geminiClient) {
        const GoogleGenAI = await loadGemini();
        geminiClient = new GoogleGenAI({
          apiKey,
          ...(baseUrl ? { httpOptions: { baseUrl } } : {}),
        });
      }

      const response = await geminiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          // Nudge the model toward machine-readable output.
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      const text = response.text ?? '';
      if (!text.trim()) throw new Error('Empty response from model');
      return text;
    },
  };
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

let selected: Provider | null = null;

/**
 * Picks the active provider. OpenRouter wins when its key is set, so a
 * GEMINI_API_KEY left over from earlier setup doesn't silently take over.
 */
export function getProvider(): Provider {
  if (selected) return selected;

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    selected = createOpenRouterProvider(openRouterKey);
    return selected;
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    selected = createGeminiProvider(geminiKey);
    return selected;
  }

  // No key: report an unconfigured stub so the app degrades with a clear
  // message instead of crashing.
  selected = {
    name: 'openrouter',
    model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
    configured: false,
    generate: async () => {
      throw new ProviderConfigError(
        'No AI key is set. Add OPENROUTER_API_KEY (or GEMINI_API_KEY) to .env and restart.'
      );
    },
  };
  return selected;
}

export const DEFAULT_MODELS = {
  openrouter: DEFAULT_OPENROUTER_MODEL,
  gemini: DEFAULT_GEMINI_MODEL,
} as const;
