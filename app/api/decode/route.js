import { NextResponse } from "next/server";
import { getDecoderPrompt } from "@/lib/prompts";

export async function POST(request) {
  try {
    const body = await request.json();
    const { assignment } = body;

    if (typeof assignment !== "string" || !assignment.trim()) {
      return NextResponse.json({ error: "Expected { assignment: string } in body" }, { status: 400 });
    }

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:27b",
        messages: [
          {
            role: "user",
            content: getDecoderPrompt(assignment),
          },
        ],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const detail = await ollamaResponse.text();
      return NextResponse.json(
        { error: "Ollama request failed", status: ollamaResponse.status, detail },
        { status: 502 },
      );
    }

    const data = await ollamaResponse.json();
    const raw = data.message?.content;
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Unexpected Ollama response shape" }, { status: 502 });
    }

    const trimmed = raw.trim();
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf("[");
      const end = trimmed.lastIndexOf("]");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Model output was not valid JSON array text");
      }
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "Decoded JSON was not an array" }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
