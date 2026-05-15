"use client";

import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import AccessibilityToggles from "@/components/AccessibilityToggles";
import ProgressBar from "@/components/ProgressBar";
import TaskCard from "@/components/TaskCard";

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.js";

const FONT_SIZE_CLASSES = ["", "text-size-large", "text-size-xlarge"];

async function extractTextFromPdf(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const chunks = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) chunks.push(pageText);
  }

  return chunks.join("\n\n").trim();
}

export default function Home() {
  const [assignment, setAssignment] = useState("");
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedPdfName, setUploadedPdfName] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const fileInputRef = useRef(null);

  const inTaskFlow = tasks.length > 0 && currentIndex < tasks.length;
  const allDone = tasks.length > 0 && currentIndex >= tasks.length;

  const rootClassName = [
    "app-root",
    FONT_SIZE_CLASSES[fontSizeLevel],
    highContrast ? "high-contrast" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function cycleFontSize() {
    setFontSizeLevel((level) => (level + 1) % 3);
  }

  async function handleBreakDown(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not break down assignment");
      }
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server");
      }
      setTasks(data);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setPdfParsing(true);
    try {
      const text = await extractTextFromPdf(file);
      if (!text) {
        throw new Error("No readable text found in that PDF.");
      }
      setAssignment(text);
      setUploadedPdfName(file.name);
    } catch (err) {
      setUploadedPdfName(null);
      setError(err instanceof Error ? err.message : "Could not read that PDF.");
    } finally {
      setPdfParsing(false);
    }
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1);
  }

  function handlePlanAnother() {
    setTasks([]);
    setCurrentIndex(0);
    setError(null);
    setUploadedPdfName(null);
  }

  return (
    <div className={rootClassName}>
      <header className="app-header">
        <div className="app-container flex items-start justify-between gap-6 py-6 md:py-8">
          <div className="min-w-0 space-y-2 pr-2">
            <h1 className="app-heading text-2xl md:text-3xl">StepWise</h1>
            <p className="app-text-muted text-base leading-relaxed">
              One task at a time. No overwhelm.
            </p>
          </div>
          <AccessibilityToggles
            fontSizeLevel={fontSizeLevel}
            onFontSizeCycle={cycleFontSize}
            highContrast={highContrast}
            onHighContrastToggle={() => setHighContrast((on) => !on)}
          />
        </div>
      </header>

      <main className="app-container space-y-12 py-12 md:space-y-14 md:py-16">
        {!inTaskFlow && !allDone && (
          <form onSubmit={handleBreakDown} className="app-surface space-y-8">
            <div>
              <label htmlFor="assignment" className="mb-3 block text-sm font-medium app-text-muted">
                Your assignment
              </label>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <textarea
                  id="assignment"
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  disabled={loading || pdfParsing}
                  className="app-textarea min-w-0 flex-1"
                  placeholder="Paste the full instructions from your teacher here…"
                />
                <div className="flex shrink-0 flex-col gap-3 lg:w-40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={handlePdfSelected}
                    disabled={loading || pdfParsing}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || pdfParsing}
                    className="app-btn-secondary w-full"
                  >
                    {pdfParsing ? "Reading PDF…" : "Upload PDF"}
                  </button>
                  {uploadedPdfName && !pdfParsing && (
                    <p className="text-xs leading-snug app-text-subtle" title={uploadedPdfName}>
                      <span className="font-medium">Loaded:</span>{" "}
                      <span className="break-all">{uploadedPdfName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading || pdfParsing || !assignment.trim()}
                className="app-btn-primary px-8 py-3.5"
              >
                Break it down
              </button>
              {loading && (
                <div className="flex items-center justify-center gap-3 app-text-muted sm:justify-end">
                  <span
                    className="app-spinner h-8 w-8 shrink-0 rounded-full border-2 animate-spin"
                    aria-hidden
                  />
                  <span className="text-sm font-medium">Talking to Gemma…</span>
                </div>
              )}
            </div>

            {error && <p className="app-feedback-error">{error}</p>}
          </form>
        )}

        {inTaskFlow && (
          <div className="space-y-10">
            <ProgressBar completed={currentIndex} total={tasks.length} />
            <TaskCard
              key={currentIndex}
              task={tasks[currentIndex]}
              taskNumber={currentIndex + 1}
              totalTasks={tasks.length}
              onNext={handleNext}
            />
          </div>
        )}

        {allDone && (
          <div className="space-y-10">
            <ProgressBar completed={tasks.length} total={tasks.length} />
            <div className="app-surface space-y-8 text-center">
              <p className="text-lg leading-relaxed app-text-muted">
                You&apos;ve walked through every step for this assignment.
              </p>
              <button type="button" onClick={handlePlanAnother} className="app-btn-primary">
                Plan another assignment
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
