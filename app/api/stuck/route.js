import { NextResponse } from "next/server";
import { getStuckPrompt } from "@/lib/prompts";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskInstruction, studentResponse } = body;

    if (typeof taskInstruction !== "string" || !taskInstruction.trim()) {
      return NextResponse.json(
        { error: "Expected { taskInstruction: string, studentResponse: string } in body" },
        { status: 400 },
      );
    }

    const responseText = typeof studentResponse === "string" ? studentResponse : "";

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:27b",
        messages: [
          {
            role: "user",
            content: getStuckPrompt(taskInstruction, responseText),
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
    const explanation = data.message?.content;
    if (typeof explanation !== "string" || !explanation.trim()) {
      return NextResponse.json({ error: "Unexpected Ollama response shape" }, { status: 502 });
    }

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
