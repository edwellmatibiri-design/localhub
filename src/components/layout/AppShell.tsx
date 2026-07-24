"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="bg-lh-bg text-lh-text-primary min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lh-text-secondary mt-1 text-sm">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="border-lh-border bg-lh-surface text-lh-text-secondary rounded-full border px-3 py-1 text-xs">
              LocalHub Marketplace - Admin
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="space-y-6">{children}</main>

        <footer className="border-lh-border text-lh-text-secondary mt-10 border-t pt-6 text-xs">
          LocalHub Marketplace - Powered by Melissa - {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
