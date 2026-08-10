"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function Input({ className, label, error, id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-foreground">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "rounded-md border-2 border-border bg-white px-3 py-2 text-foreground outline-none transition focus:border-primary",
          error && "border-accent",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
  }
>(function Textarea({ className, label, error, id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-foreground">{label}</span>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "min-h-28 rounded-md border-2 border-border bg-white px-3 py-2 text-foreground outline-none transition focus:border-primary",
          error && "border-accent",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  );
});

export function Select({
  label,
  error,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-foreground">{label}</span>
      ) : null}
      <select
        className={cn(
          "rounded-md border-2 border-border bg-white px-3 py-2 text-foreground outline-none transition focus:border-primary",
          error && "border-accent",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  );
}
