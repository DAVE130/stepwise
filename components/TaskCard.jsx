"use client";

import { useState } from "react";
import StuckButton from "@/components/StuckButton";

const EMPTY_ANSWER_PROMPT =
  "Try writing a quick answer first — even a few words is fine!";

function priorityDotClass(priority) {
  const p = String(priority || "").toLowerCase();
  if (p === "high") return "priority-dot-high";
  if (p === "medium") return "priority-dot-medium";
  return "priority-dot-low";
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
    <article className="app-surface space-y-8">
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${priorityDotClass(task.priority)}`}
          title={task.priority}
          aria-hidden
        />
        <p className="text-sm font-medium tracking-wide app-text-subtle">
          Task {taskNumber} of {totalTasks}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="app-heading text-2xl leading-snug md:text-3xl">{task.title}</h2>
        <p className="text-lg leading-relaxed app-text-muted">{task.instruction}</p>
      </div>

      <div className="app-muted-box space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide app-text-subtle">Check</p>
        <p className="text-base leading-relaxed">{task.check_question}</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium app-text-muted">Your answer</span>
        <input
          type="text"
          value={checkAnswer}
          onChange={handleAnswerChange}
          disabled={checking}
          className="app-input"
          placeholder="Type a short answer…"
        />
      </label>

      {showYellowBox && (
        <p className="app-feedback-amber" role="status" aria-live="polite">
          {checkFeedback}
        </p>
      )}

      {checkError && <p className="app-feedback-error">{checkError}</p>}

      <StuckButton taskInstruction={task.instruction} studentResponse={checkAnswer} />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleDoneNext}
          disabled={checking}
          className="app-btn-primary"
        >
          {checking ? "Checking…" : "Done, next"}
        </button>
      </div>
    </article>
  );
}
