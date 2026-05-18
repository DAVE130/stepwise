const OLLAMA_MODEL = "gemma3:27b";
const TOGETHER_MODEL = "google/gemma-3-27b-it";
const TOGETHER_CHAT_URL = "https://api.together.xyz/v1/chat/completions";

function getOllamaChatUrl() {
  const base = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
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
  console.log("TOGETHER_API_KEY present:", !!process.env.TOGETHER_API_KEY);

  const togetherKey = process.env["TOGETHER_API_KEY"];
  if (togetherKey != null && String(togetherKey).trim() !== "") {
    console.log("LLM provider: together");
    return chatTogether(messages, String(togetherKey).trim());
  }

  console.log("LLM provider: ollama");
  return chatOllama(messages);
}

export function getLlmProvider() {
  const togetherKey = process.env["TOGETHER_API_KEY"];
  return togetherKey != null && String(togetherKey).trim() !== "" ? "together" : "ollama";
}
