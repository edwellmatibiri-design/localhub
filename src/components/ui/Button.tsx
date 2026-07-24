import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-lh-accent";
  const variants: Record<string, string> = {
    primary: "bg-lh-accent text-lh-on-accent hover:bg-lh-accent-soft",
    secondary:
      "border border-lh-border bg-lh-surface-soft text-lh-text-primary hover:bg-lh-surface",
    ghost:
      "border border-transparent bg-transparent text-lh-text-secondary hover:bg-lh-surface-soft",
    danger: "bg-lh-danger text-lh-on-accent hover:brightness-95",
    success: "bg-lh-success text-lh-on-accent hover:brightness-95",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
