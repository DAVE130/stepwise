const FONT_SIZE_LABELS = ["Normal text", "Large text", "Extra large text"];

export default function AccessibilityToggles({
  fontSizeLevel,
  onFontSizeCycle,
  highContrast,
  onHighContrastToggle,
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onFontSizeCycle}
        className="app-btn-toggle min-w-[2.75rem]"
        aria-label={`${FONT_SIZE_LABELS[fontSizeLevel]}. Click to change font size.`}
        title={FONT_SIZE_LABELS[fontSizeLevel]}
      >
        Aa
      </button>
      <button
        type="button"
        onClick={onHighContrastToggle}
        className="app-btn-toggle min-w-[2.75rem]"
        aria-pressed={highContrast}
        aria-label={highContrast ? "High contrast on. Click to turn off." : "High contrast off. Click to turn on."}
        title="High contrast"
      >
        ◐
      </button>
    </div>
  );
}
