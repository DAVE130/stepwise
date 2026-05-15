export default function ProgressBar({ completed, total }) {
  const safeTotal = total > 0 ? total : 1;
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  const percent = (safeCompleted / safeTotal) * 100;
  const isComplete = safeTotal > 0 && safeCompleted === safeTotal;

  return (
    <div className="w-full">
      <div className="app-progress-track">
        <div
          className="app-progress-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={safeCompleted}
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-label={`${safeCompleted} of ${safeTotal} tasks done`}
        />
      </div>

      <p className="mt-4 text-center text-sm font-medium app-text-muted">
        {safeCompleted} of {safeTotal} tasks done
      </p>

      {isComplete && (
        <p className="mt-5 text-center text-base font-medium app-accent-text">
          You&apos;re ready to start writing! Good luck. ✅
        </p>
      )}
    </div>
  );
}
