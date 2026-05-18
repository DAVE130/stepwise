import { NextResponse } from "next/server";
import { chat } from "@/lib/llm";
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

    const raw = await chat([
      {
        role: "user",
        content: getCheckerPrompt(taskInstruction, checkQuestion, studentAnswer),
      },
    ]);

    const parsed = parseCheckerResponse(raw);
    const canProceed = parsed.can_proceed === true || parsed.can_proceed === "true";
    const feedback = typeof parsed.feedback === "string" ? parsed.feedback.trim() : "";

    return NextResponse.json({
      can_proceed: canProceed,
      feedback: feedback || (canProceed ? "Nice work — moving on!" : "Take another look and try again."),
    });
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
