// Compliance boundary: decides whether the app is handling real citizen PII and which AI
// providers are permitted to see that data. DATA_PATH=sensitive must never route to
// Gemini/DeepSeek — see DECISIONS.md D9/D10 and PRIVACY.md.

export type DataPath = "sensitive" | "demo";

// Providers cleared to receive real citizen data (DECISIONS.md D9). Groq is the only one:
// it does not train on submitted data, so it is the sole LLM on the real-PII path.
const SENSITIVE_PROVIDERS: readonly string[] = ["groq"];

// Reads DATA_PATH, defaulting to "demo" so behaviour is unchanged when the var is unset.
// An unrecognized value throws instead of silently falling back to the permissive path: a typo
// like "Sensitive" or "sensitiv" must fail loudly, not quietly disable the guard.
export const getDataPath = (): DataPath => {
  const raw = (process.env.DATA_PATH ?? "demo").trim().toLowerCase();
  if (raw === "sensitive" || raw === "demo") return raw;
  throw new Error(`Invalid DATA_PATH "${process.env.DATA_PATH}". Use "sensitive" or "demo".`);
};

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
