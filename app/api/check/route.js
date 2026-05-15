import { NextResponse } from "next/server";
import { getCheckerPrompt } from "@/lib/prompts";

function parseCheckerResponse(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model output was not valid JSON");
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskInstruction, checkQuestion, studentAnswer } = body;

    if (typeof taskInstruction !== "string" || !taskInstruction.trim()) {
      return NextResponse.json(
        { error: "Expected { taskInstruction, checkQuestion, studentAnswer } in body" },
        { status: 400 },
      );
    }
    if (typeof checkQuestion !== "string" || !checkQuestion.trim()) {
      return NextResponse.json({ error: "checkQuestion is required" }, { status: 400 });
    }
    if (typeof studentAnswer !== "string") {
      return NextResponse.json({ error: "studentAnswer must be a string" }, { status: 400 });
    }

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:27b",
        messages: [
          {
            role: "user",
            content: getCheckerPrompt(taskInstruction, checkQuestion, studentAnswer),
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

    const parsed = parseCheckerResponse(raw);
    const canProceed = parsed.can_proceed === true || parsed.can_proceed === "true";
    const feedback = typeof parsed.feedback === "string" ? parsed.feedback.trim() : "";

    return NextResponse.json({
      can_proceed: canProceed,
      feedback: feedback || (canProceed ? "Nice work — moving on!" : "Take another look and try again."),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
