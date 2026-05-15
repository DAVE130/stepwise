"use client";

import { useState } from "react";

export default function StuckButton({ taskInstruction, studentResponse }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState(null);

  async function handleStuck() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stuck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInstruction,
          studentResponse: studentResponse ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not get a new explanation");
      }
      setExplanation(data.explanation);
    } catch (err) {
      setExplanation(null);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleStuck}
        disabled={loading}
        className="app-btn-danger"
      >
        {loading ? "Thinking of another way…" : "I'm stuck"}
      </button>

      {loading && (
        <div className="flex items-center gap-3 text-sm app-text-muted">
          <span
            className="app-spinner h-6 w-6 shrink-0 rounded-full border-2 animate-spin"
            aria-hidden
          />
          <span>Finding a new way to explain this…</span>
        </div>
      )}

      {error && <p className="app-feedback-error">{error}</p>}

      {explanation && !loading && (
        <div className="app-feedback-rose" aria-live="polite">
          <p className="app-feedback-rose-title text-sm font-medium">Another way to look at it</p>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
