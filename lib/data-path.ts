// Compliance boundary: decides whether the app is handling real citizen PII and which AI
// providers are permitted to see that data. DATA_PATH=sensitive must never route to
// Gemini/DeepSeek — see DECISIONS.md D9/D10 and PRIVACY.md.

export type DataPath = "sensitive" | "demo";

// Providers cleared to receive real citizen data. Empty until WS1 adds lib/groq.ts, so the
// sensitive path currently fails closed (no provider can be served).
const SENSITIVE_PROVIDERS: readonly string[] = [];

// Reads DATA_PATH, defaulting to "demo" so behaviour is unchanged when the var is unset.
export const getDataPath = (): DataPath => (process.env.DATA_PATH === "sensitive" ? "sensitive" : "demo");

// Throws when `name` is not permitted on the current DATA_PATH. On the sensitive path anything
// outside SENSITIVE_PROVIDERS is rejected, so real data can never reach a training provider.
export const assertProviderAllowed = (name: string): void => {
  if (getDataPath() === "sensitive" && !SENSITIVE_PROVIDERS.includes(name)) {
    throw new Error(
      `DATA_PATH=sensitive forbids provider "${name}". Allowed: ${
        SENSITIVE_PROVIDERS.length ? SENSITIVE_PROVIDERS.join(", ") : "none configured yet"
      }.`,
    );
  }
};
