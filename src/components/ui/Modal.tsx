import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="bg-lh-bg/40 fixed inset-0 z-50 flex items-center justify-center">
      <div className="border-lh-border bg-lh-surface shadow-lh-soft w-full max-w-md rounded-2xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-lh-text-secondary hover:text-lh-text-primary text-xs"
          >
            Close
          </button>
        </div>
        <div className="text-lh-text-secondary text-sm">{children}</div>
      </div>
    </div>
  );
}
