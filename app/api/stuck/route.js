import { NextResponse } from "next/server";
import { chat } from "@/lib/llm";
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

    const explanation = await chat([
      {
        role: "user",
        content: getStuckPrompt(taskInstruction, responseText),
      },
    ]);

    if (!explanation.trim()) {
      return NextResponse.json({ error: "Unexpected LLM response shape" }, { status: 502 });
    }

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (err?.status) {
      return NextResponse.json(
        {
          error: message.includes("Together") ? "Together AI request failed" : "Ollama request failed",
          status: err.status,
          detail: err.detail,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
