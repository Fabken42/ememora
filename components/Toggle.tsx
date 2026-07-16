"use client";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: React.ReactNode;
  /** Extra content rendered inline in the label (e.g. an icon). */
  labelSuffix?: React.ReactNode;
}

/**
 * Accessible on/off switch. Renders a real `role="switch"` button so it is
 * focusable and operable by keyboard (Space/Enter), unlike a bare clickable div.
 */
export default function Toggle({ checked, onChange, label, description, labelSuffix }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          {label}
          {labelSuffix}
        </p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`inline-flex shrink-0 items-center w-10 h-6 p-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111827] ${
          checked ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-[#2f3d5a] justify-start"
        }`}
      >
        <span className="w-4 h-4 bg-white rounded-full shadow transition-transform" />
      </button>
    </div>
  );
}
