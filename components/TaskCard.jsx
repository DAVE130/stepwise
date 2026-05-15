"use client";

import { useState } from "react";
import StuckButton from "@/components/StuckButton";

const EMPTY_ANSWER_PROMPT =
  "Try writing a quick answer first — even a few words is fine!";

function priorityDotClass(priority) {
  const p = String(priority || "").toLowerCase();
  if (p === "high") return "bg-emerald-500";
  if (p === "medium") return "bg-amber-400";
  return "bg-slate-400";
}

export default function TaskCard({ task, taskNumber, totalTasks, onNext }) {
  const [checkAnswer, setCheckAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState(null);
  const [emptyPromptShown, setEmptyPromptShown] = useState(false);
  const [checkError, setCheckError] = useState(null);

  function handleAnswerChange(e) {
    setCheckAnswer(e.target.value);
    setCheckFeedback(null);
    setCheckError(null);
    if (e.target.value.trim()) {
      setEmptyPromptShown(false);
    }
  }

  async function handleDoneNext() {
    const trimmed = checkAnswer.trim();

    if (!trimmed) {
      if (!emptyPromptShown) {
        setEmptyPromptShown(true);
        setCheckFeedback(EMPTY_ANSWER_PROMPT);
        setCheckError(null);
        return;
      }
      onNext();
      return;
    }

    setCheckError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInstruction: task.instruction,
          checkQuestion: task.check_question,
          studentAnswer: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not check your answer");
      }

      if (data.can_proceed) {
        onNext();
        return;
      }

      setCheckFeedback(data.feedback || "You're close — give it another try when you're ready.");
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChecking(false);
    }
  }

  const showYellowBox = checkFeedback && !checking;

  return (
    <article className="max-w-2xl mx-auto rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70 md:p-12">
      <div className="mb-10 flex items-center gap-3">
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${priorityDotClass(task.priority)}`}
          title={task.priority}
          aria-hidden
        />
        <p className="text-sm font-medium tracking-wide text-slate-500">
          Task {taskNumber} of {totalTasks}
        </p>
      </div>

      <h2 className="mb-6 text-2xl font-bold leading-snug text-slate-900 md:text-3xl">
        {task.title}
      </h2>

      <p className="mb-10 text-lg leading-relaxed text-slate-700">{task.instruction}</p>

      <div className="mb-8 rounded-xl bg-slate-50 px-5 py-5 text-slate-700 ring-1 ring-slate-100">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Check</p>
        <p className="mt-2 text-base leading-relaxed">{task.check_question}</p>
      </div>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium text-slate-600">Your answer</span>
        <input
          type="text"
          value={checkAnswer}
          onChange={handleAnswerChange}
          disabled={checking}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
          placeholder="Type a short answer…"
        />
      </label>

      {showYellowBox && (
        <p
          className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-100"
          role="status"
          aria-live="polite"
        >
          {checkFeedback}
        </p>
      )}

      {checkError && (
        <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
          {checkError}
        </p>
      )}

      <StuckButton taskInstruction={task.instruction} studentResponse={checkAnswer} />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleDoneNext}
          disabled={checking}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? "Checking…" : "Done, next"}
        </button>
      </div>
    </article>
  );
}
