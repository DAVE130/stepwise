import { NextResponse } from "next/server";
import { chat } from "@/lib/llm";
import { getDecoderPrompt } from "@/lib/prompts";

function parseTaskArray(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model output was not valid JSON array text");
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function llmErrorResponse(err, label) {
  const status = err?.status && Number.isInteger(err.status) ? err.status : 502;
  return NextResponse.json(
    {
      error: `${label} request failed`,
      status,
      detail: err?.detail || (err instanceof Error ? err.message : "Unknown error"),
    },
    { status: 502 },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { assignment, imageBase64 } = body;

    let raw;

    if (imageBase64) {
      if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
        return NextResponse.json({ error: "imageBase64 must be a non-empty string" }, { status: 400 });
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "").trim();

      raw = await chat([
        {
          role: "user",
          content: [
            { type: "image", data: cleanBase64 },
            { type: "text", text: getDecoderPrompt("") },
          ],
        },
      ]);
    } else {
      if (typeof assignment !== "string" || !assignment.trim()) {
        return NextResponse.json(
          { error: "Expected { assignment: string } or { imageBase64, mimeType } in body" },
          { status: 400 },
        );
      }

      raw = await chat([
        {
          role: "user",
          content: getDecoderPrompt(assignment),
        },
      ]);
    }

    const parsed = parseTaskArray(raw);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "Decoded JSON was not an array" }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Full error:", err);
    if (err?.status) {
      return llmErrorResponse(err, err.message?.includes("Together") ? "Together AI" : "Ollama");
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
