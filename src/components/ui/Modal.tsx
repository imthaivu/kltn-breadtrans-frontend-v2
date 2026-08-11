"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { FiX } from "react-icons/fi";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} transition className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/40 duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={cn(
            "w-full max-w-md rounded-[var(--radius-card)] border border-border bg-white p-5 shadow-xl duration-200 ease-out data-closed:scale-95 data-closed:opacity-0",
            className,
          )}
        >
          {title ? (
            <div className="mb-3 flex items-center justify-between gap-3">
              <DialogTitle className="text-base font-semibold text-foreground">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
                aria-label="Đóng"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <div className="text-sm text-foreground">{children}</div>
          {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
