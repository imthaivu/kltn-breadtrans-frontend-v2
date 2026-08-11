import type { Question } from "@/lib/api/types";

/** Loại câu hỏi hỗ trợ trong trình soạn đề của giáo viên (khớp với cách QuestionCard hiển thị). */
export type BuilderQuestionType = "MULTIPLE_CHOICE" | "FILL_BLANK";

/** Giá trị form soạn 1 câu hỏi — luôn map sang đúng 1 shape JSONB duy nhất, không cho giáo viên gõ JSON tay. */
export type QuestionFormValue = {
  type: BuilderQuestionType;
  question: string;
  part?: string;
  options: string[];
  correct: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
};

export function emptyQuestionForm(type: BuilderQuestionType = "MULTIPLE_CHOICE"): QuestionFormValue {
  return {
    type,
    question: "",
    part: "",
    options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [],
    correct: "",
    explanation: "",
    audioUrl: "",
    imageUrl: "",
    passage: "",
  };
}

/** Chuyển form soạn câu hỏi thành content JSONB — cùng shape mà `getCorrectAnswer`/`parseQuestionContent` (lib/toeic.ts) đọc lại. */
export function buildQuestionContent(form: QuestionFormValue): Record<string, unknown> {
  const content: Record<string, unknown> = {
    question: form.question.trim(),
    correct: form.correct.trim(),
  };
  if (form.type === "MULTIPLE_CHOICE") {
    content.options = form.options.map((o) => o.trim()).filter(Boolean);
  }
  const part = Number(form.part);
  if (form.part && Number.isFinite(part)) content.part = part;
  if (form.explanation?.trim()) content.explanation = form.explanation.trim();
  if (form.audioUrl?.trim()) content.audioUrl = form.audioUrl.trim();
  if (form.imageUrl?.trim()) content.imageUrl = form.imageUrl.trim();
  if (form.passage?.trim()) content.passage = form.passage.trim();
  return content;
}

/** Câu hỏi do AI sinh (Gemini trả `{ text, options, correctAnswer, explanation }`) — chuẩn hoá về form để giáo viên xem/sửa trước khi lưu. */
export function draftFromAiQuestion(raw: unknown): QuestionFormValue {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const options = Array.isArray(r.options)
    ? r.options.map((o) => String(o))
    : ["", "", "", ""];
  return {
    type: "MULTIPLE_CHOICE",
    question: String(r.text ?? r.question ?? ""),
    part: r.part != null ? String(r.part) : "",
    options,
    correct: String(r.correctAnswer ?? r.correct ?? ""),
    explanation: r.explanation != null ? String(r.explanation) : "",
    audioUrl: "",
    imageUrl: "",
    passage: "",
  };
}

/** Preview trực quan (dùng QuestionCard) cho 1 form đang soạn — không cần lưu DB mới xem được sẽ hiển thị ra sao. */
export function previewQuestionFromForm(form: QuestionFormValue, id = -1): Question {
  return {
    id,
    type: form.type,
    content: buildQuestionContent(form),
  };
}

export function parseQuestionContent(q: Question): {
  prompt: string;
  options: string[];
} {
  const content = q.content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as {
        question?: string;
        prompt?: string;
        text?: string;
        options?: string[];
        choices?: string[];
      };
      return {
        prompt: parsed.question || parsed.prompt || parsed.text || content,
        options: parsed.options || parsed.choices || [],
      };
    } catch {
      return { prompt: content, options: [] };
    }
  }
  if (content && typeof content === "object") {
    const c = content as Record<string, unknown>;
    const opts = c.options || c.choices;
    return {
      prompt: String(c.question || c.prompt || c.text || JSON.stringify(c)),
      options: Array.isArray(opts)
        ? opts.map((o) =>
            typeof o === "string"
              ? o
              : String((o as { text?: string }).text ?? o),
          )
        : [],
    };
  }
  return { prompt: "Câu hỏi", options: [] };
}
