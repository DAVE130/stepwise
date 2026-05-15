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
    <div className="mb-8">
      <button
        type="button"
        onClick={handleStuck}
        disabled={loading}
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Thinking of another way…" : "I'm stuck"}
      </button>

      {loading && (
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
          <span
            className="h-6 w-6 shrink-0 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin"
            aria-hidden
          />
          <span>Finding a new way to explain this…</span>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {explanation && !loading && (
        <div
          className="mt-4 rounded-xl bg-rose-50 px-5 py-5 text-slate-800 ring-1 ring-rose-100"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-rose-800">Another way to look at it</p>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
