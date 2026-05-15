export default function ProgressBar({ completed, total }) {
  const safeTotal = total > 0 ? total : 1;
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  const percent = (safeCompleted / safeTotal) * 100;
  const isComplete = safeTotal > 0 && safeCompleted === safeTotal;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={safeCompleted}
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-label={`${safeCompleted} of ${safeTotal} tasks done`}
        />
      </div>

      <p className="mt-3 text-center text-sm font-medium text-slate-600">
        {safeCompleted} of {safeTotal} tasks done
      </p>

      {isComplete && (
        <p className="mt-4 text-center text-base font-medium text-emerald-700">
          You&apos;re ready to start writing! Good luck. ✅
        </p>
      )}
    </div>
  );
}
