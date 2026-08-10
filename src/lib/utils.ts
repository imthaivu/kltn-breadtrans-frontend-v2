import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join(", ");
    return String(msg);
  }
  return "Đã xảy ra lỗi";
}
