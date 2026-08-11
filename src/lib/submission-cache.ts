import type { Question, SubmitQuizResponse } from "@/lib/api/types";

const KEY_PREFIX = "bt_submission_";

export type CachedSubmission = {
  quizId: number;
  quizTitle?: string;
  submission: SubmitQuizResponse;
  /** Snapshot câu hỏi lúc nộp bài (kèm đáp án đúng trong content) — BE không có
   * endpoint GET submission theo id nên phải lưu tạm ở client để hiển thị review. */
  questions: Question[];
  flaggedQuestionIds?: number[];
};

/**
 * Lưu tạm kết quả nộp bài vào sessionStorage để trang kết quả có thể hiển thị
 * chi tiết từng câu (BE chỉ có GET .../analytics dạng tổng hợp, không trả về
 * results[] theo submissionId sau khi rời trang submit).
 */
export function cacheSubmission(data: CachedSubmission) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${KEY_PREFIX}${data.submission.id}`,
      JSON.stringify(data),
    );
  } catch {
    // sessionStorage có thể đầy/bị chặn — bỏ qua, trang kết quả sẽ tự fallback
  }
}

export function getCachedSubmission(submissionId: number): CachedSubmission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${KEY_PREFIX}${submissionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSubmission;
  } catch {
    return null;
  }
}
