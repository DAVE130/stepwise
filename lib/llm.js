const OLLAMA_MODEL = "gemma3:27b";
const TOGETHER_MODEL = "google/gemma-3-27b-it";
const TOGETHER_CHAT_URL = "https://api.together.xyz/v1/chat/completions";

const PLACEHOLDER_KEYS = new Set(["your_key_here", "your-together-api-key", "changeme", "xxx"]);

// Dynamic access so Next.js does not bake in `undefined` at build time on Vercel.
function readEnv(name) {
  return process.env[name];
}

console.log("TOGETHER_API_KEY present:", Boolean(readEnv("TOGETHER_API_KEY")));

function getTogetherApiKey() {
  const raw = readEnv("TOGETHER_API_KEY");
  if (typeof raw !== "string") return null;

  const key = raw.trim();
  if (!key) return null;
  if (PLACEHOLDER_KEYS.has(key.toLowerCase())) return null;

  return key;
}

function shouldUseTogether() {
  return Boolean(getTogetherApiKey());
}

function getOllamaChatUrl() {
  const base = (readEnv("OLLAMA_URL") || "http://127.0.0.1:11434").replace(/\/$/, "");
  return `${base}/api/chat`;
}

function toTogetherMessages(messages) {
  return messages.map((message) => {
    if (typeof message.content === "string") {
      return { role: message.role, content: message.content };
    }

    if (Array.isArray(message.content)) {
      const content = message.content.map((part) => {
        if (part.type === "text") {
          return { type: "text", text: part.text };
        }
        if (part.type === "image") {
          const base64 = String(part.data || "").replace(/^data:[^;]+;base64,/, "");
          return {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${base64}` },
          };
        }
        return part;
      });
      return { role: message.role, content };
    }

    return message;
  });
}

async function chatOllama(messages) {
  const url = getOllamaChatUrl();
  console.log("Calling Ollama at:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("Ollama request failed");
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  const data = await response.json();
  const content = data.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected Ollama response shape");
  }

  return content;
}

async function chatTogether(messages, apiKey) {
  console.log("Calling Together AI at:", TOGETHER_CHAT_URL);

  const response = await fetch(TOGETHER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      messages: toTogetherMessages(messages),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("Together AI request failed");
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected Together AI response shape");
  }

  return content;
}

/**
 * @param {Array<{ role: string, content: string | Array<{ type: string, text?: string, data?: string }> }>} messages
 * @returns {Promise<string>}
 */
export async function chat(messages) {
  const togetherKey = getTogetherApiKey();
  const useTogether = Boolean(togetherKey);

  console.log("LLM provider:", useTogether ? "together" : "ollama");
  console.log("TOGETHER_API_KEY present:", Boolean(togetherKey));
  console.log("VERCEL:", readEnv("VERCEL"));

  if (useTogether) {
    return chatTogether(messages, togetherKey);
  }

  if (readEnv("VERCEL") === "1") {
    console.warn(
      "On Vercel but no valid TOGETHER_API_KEY — falling back to Ollama (this will fail if OLLAMA_URL points to localhost).",
    );
  }

  return chatOllama(messages);
}

export function getLlmProvider() {
  return shouldUseTogether() ? "together" : "ollama";
}
