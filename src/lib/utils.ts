import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Đọc linh hoạt các field score/feedback/suggestions từ response chấm AI (Writing/Speaking) — BE trả shape khác nhau tùy Part. */
export function parseFeedbackResult(result: unknown): {
  score?: number;
  maxScore?: number;
  feedback?: string;
  suggestions?: string[];
} {
  if (!result || typeof result !== "object") return {};
  const r = result as Record<string, unknown>;
  const score = typeof r.score === "number" ? r.score : undefined;
  const maxScore = typeof r.maxScore === "number" ? r.maxScore : undefined;
  const feedback =
    typeof r.feedback === "string"
      ? r.feedback
      : typeof r.aiFeedback === "string"
        ? r.aiFeedback
        : undefined;
  const suggestions = Array.isArray(r.suggestions)
    ? r.suggestions.filter((s): s is string => typeof s === "string")
    : undefined;
  return { score, maxScore, feedback, suggestions };
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

/** Lấy R2 object key từ public URL (vd: https://cdn/.../images/uuid.png → images/uuid.png). */
export function extractUploadKey(fileUrl: string): string | null {
  try {
    const path = new URL(fileUrl).pathname.replace(/^\/+/, "");
    return path || null;
  } catch {
    return null;
  }
}
