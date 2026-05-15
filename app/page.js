"use client";

import { useRef, useState } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import TaskCard from "@/components/TaskCard";
import ProgressBar from "@/components/ProgressBar";

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

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
  const fileInputRef = useRef(null);

  const inTaskFlow = tasks.length > 0 && currentIndex < tasks.length;
  const allDone = tasks.length > 0 && currentIndex >= tasks.length;

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
    <main className="min-h-screen bg-slate-50 px-4 py-14 text-slate-900 md:py-20">
      <div className="mx-auto max-w-3xl space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            StepWise
          </h1>
          <p className="mt-3 text-lg text-slate-600">Paste an assignment. We turn it into small steps.</p>
        </header>

        {!inTaskFlow && !allDone && (
          <form
            onSubmit={handleBreakDown}
            className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70 md:p-10"
          >
            <div className="mb-3">
              <span className="text-sm font-medium text-slate-600">Your assignment</span>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
              <label className="block min-w-0 flex-1">
                <span className="sr-only">Assignment text</span>
                <textarea
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  disabled={loading || pdfParsing}
                  rows={10}
                  className="min-h-[12rem] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-base leading-relaxed text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 disabled:opacity-60 lg:min-h-[14rem]"
                  placeholder="Paste the full instructions from your teacher here…"
                />
              </label>

              <div className="flex shrink-0 flex-col gap-2 lg:w-44">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pdfParsing ? "Reading PDF…" : "Upload PDF"}
                </button>
                {uploadedPdfName && !pdfParsing && (
                  <p className="text-xs leading-snug text-slate-500" title={uploadedPdfName}>
                    <span className="font-medium text-slate-600">Loaded:</span>{" "}
                    <span className="break-all text-slate-700">{uploadedPdfName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading || pdfParsing || !assignment.trim()}
                className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Break it down
              </button>
              {loading && (
                <div className="flex items-center justify-center gap-3 text-slate-600 sm:justify-end">
                  <span
                    className="h-9 w-9 shrink-0 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin"
                    aria-hidden
                  />
                  <span className="text-sm font-medium">Talking to Gemma…</span>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
                {error}
              </p>
            )}
          </form>
        )}

        {inTaskFlow && (
          <div className="space-y-8">
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
          <div className="space-y-8">
            <ProgressBar completed={tasks.length} total={tasks.length} />
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="text-lg text-slate-700">You&apos;ve walked through every step for this assignment.</p>
            <button
              type="button"
              onClick={handlePlanAnother}
              className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Plan another assignment
            </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
