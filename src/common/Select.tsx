import { useId } from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

/**
 * Reusable styled select dropdown.
 * Typed generically so the onChange always returns the exact union type
 * of the provided options (e.g. CryptoPair or StreamMode) — no casting needed.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-widest uppercase text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="
            w-full appearance-none cursor-pointer
            bg-slate-900 border border-slate-700
            text-slate-100 text-sm font-medium
            pl-3 pr-8 py-2 rounded-md
            focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500
            hover:border-slate-500
            transition-colors duration-150
          "
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom chevron — replaces the default OS arrow */}
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-500">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
