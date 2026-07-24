import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border-lh-border bg-lh-surface-soft text-lh-text-primary placeholder:text-lh-text-secondary focus:ring-lh-accent rounded-2xl border px-4 py-2 text-sm focus:ring-2 focus:outline-none ${className}`}
      {...props}
    />
  );
}
