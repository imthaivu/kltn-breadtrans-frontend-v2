import type { Question } from "@/lib/api/types";

export type ToeicSkill = "listening" | "reading";

export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PartMeta = {
  part: ToeicPart;
  label: string;
  shortLabel: string;
  skill: ToeicSkill;
  description: string;
};

/** Cấu trúc chuẩn TOEIC Listening & Reading — quy ước hiển thị trên FE. */
export const PART_META: Record<ToeicPart, PartMeta> = {
  1: {
    part: 1,
    label: "Part 1 — Photographs",
    shortLabel: "Part 1",
    skill: "listening",
    description: "Mô tả tranh — nghe và chọn câu mô tả đúng bức ảnh.",
  },
  2: {
    part: 2,
    label: "Part 2 — Question-Response",
    shortLabel: "Part 2",
    skill: "listening",
    description: "Hỏi–đáp — nghe câu hỏi và chọn phản hồi phù hợp.",
  },
  3: {
    part: 3,
    label: "Part 3 — Conversations",
    shortLabel: "Part 3",
    skill: "listening",
    description: "Đoạn hội thoại ngắn — mỗi đoạn kèm 2–3 câu hỏi.",
  },
  4: {
    part: 4,
    label: "Part 4 — Talks",
    shortLabel: "Part 4",
    skill: "listening",
    description: "Bài nói ngắn — mỗi bài kèm 2–3 câu hỏi.",
  },
  5: {
    part: 5,
    label: "Part 5 — Incomplete Sentences",
    shortLabel: "Part 5",
    skill: "reading",
    description: "Hoàn thành câu — chọn từ/cụm từ đúng ngữ pháp.",
  },
  6: {
    part: 6,
    label: "Part 6 — Text Completion",
    shortLabel: "Part 6",
    skill: "reading",
    description: "Hoàn thành đoạn văn — điền từ/câu vào chỗ trống.",
  },
  7: {
    part: 7,
    label: "Part 7 — Reading Comprehension",
    shortLabel: "Part 7",
    skill: "reading",
    description: "Đọc hiểu đoạn văn — trả lời câu hỏi liên quan.",
  },
};

export const PART_ORDER: ToeicPart[] = [1, 2, 3, 4, 5, 6, 7];

/** Bucket dùng khi câu hỏi không xác định được Part (đề cũ / tự tạo tay). */
export const UNKNOWN_PART_LABEL = "Câu hỏi khác";

function isToeicPart(value: number): value is ToeicPart {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

/** content có thể là JSON string hoặc object — luôn trả về object để đọc field. */
export function getQuestionContent(question: Question): Record<string, unknown> {
  const { content } = question;
  if (content && typeof content === "object") return content as Record<string, unknown>;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // not JSON — ignore
    }
  }
  return {};
}

/** Đọc Part 1-7 từ content.part (number hoặc "Part 3" / "3"), null nếu không xác định. */
export function getQuestionPart(question: Question): ToeicPart | null {
  const content = getQuestionContent(question);
  const raw = content.part ?? question.part;
  if (raw == null) return null;
  const match = String(raw).match(/(\d+)/);
  if (!match) return null;
  const num = Number(match[1]);
  return isToeicPart(num) ? num : null;
}

/** Chuẩn hoá field đáp án đúng — BE dùng lẫn `correct` (chấm điểm) và `correctAnswer` (AI generate/import). */
export function getCorrectAnswer(question: Question): string | undefined {
  const content = getQuestionContent(question);
  const direct = content.correct ?? content.correctAnswer ?? question.correctAnswer;
  if (typeof direct === "string") return direct;
  if (typeof direct === "number") return String(direct);
  const options = content.options ?? content.choices;
  if (Array.isArray(options)) {
    const found = options.find(
      (o) => o && typeof o === "object" && (o as { isCorrect?: boolean }).isCorrect,
    );
    if (found && typeof found === "object") {
      const text = (found as { text?: string }).text;
      if (text) return text;
    }
  }
  return undefined;
}

export function getQuestionExplanation(question: Question): string | undefined {
  const content = getQuestionContent(question);
  const explanation = content.explanation ?? question.explanation;
  return typeof explanation === "string" ? explanation : undefined;
}

export function getQuestionAudioUrl(question: Question): string | null {
  const content = getQuestionContent(question);
  const url = question.audioUrl ?? content.audioUrl;
  return typeof url === "string" && url ? url : null;
}

export function getQuestionImageUrl(question: Question): string | null {
  const content = getQuestionContent(question);
  const url = question.imageUrl ?? content.imageUrl;
  return typeof url === "string" && url ? url : null;
}

export function getQuestionPassage(question: Question): string | null {
  const content = getQuestionContent(question);
  const passage = content.passage;
  return typeof passage === "string" && passage ? passage : null;
}

export type PartGroup = {
  part: ToeicPart | null;
  meta: PartMeta | null;
  label: string;
  skill: ToeicSkill | null;
  questions: Question[];
};

/** Nhóm câu hỏi theo Part 1-7 (theo thứ tự chuẩn), câu chưa xác định Part dồn vào bucket cuối. */
export function groupQuestionsByPart(questions: Question[]): PartGroup[] {
  const byPart = new Map<ToeicPart, Question[]>();
  const unknown: Question[] = [];

  for (const q of questions) {
    const part = getQuestionPart(q);
    if (part == null) {
      unknown.push(q);
      continue;
    }
    const bucket = byPart.get(part) ?? [];
    bucket.push(q);
    byPart.set(part, bucket);
  }

  const groups: PartGroup[] = PART_ORDER.filter((p) => byPart.has(p)).map((part) => ({
    part,
    meta: PART_META[part],
    label: PART_META[part].shortLabel,
    skill: PART_META[part].skill,
    questions: byPart.get(part)!,
  }));

  if (unknown.length > 0) {
    groups.push({
      part: null,
      meta: null,
      label: UNKNOWN_PART_LABEL,
      skill: null,
      questions: unknown,
    });
  }

  return groups;
}

export type AudioBlock = {
  audioUrl: string | null;
  questions: Question[];
};

/**
 * Gộp các câu hỏi liên tiếp dùng chung 1 audioUrl thành 1 block (kiểu Part 3/4:
 * 1 đoạn hội thoại/bài nói kèm nhiều câu hỏi) — tránh lặp lại player cho mỗi câu.
 */
export function groupListeningAudioBlocks(questions: Question[]): AudioBlock[] {
  const blocks: AudioBlock[] = [];
  for (const q of questions) {
    const audioUrl = getQuestionAudioUrl(q);
    const last = blocks[blocks.length - 1];
    if (audioUrl && last && last.audioUrl === audioUrl) {
      last.questions.push(q);
    } else {
      blocks.push({ audioUrl, questions: [q] });
    }
  }
  return blocks;
}

export type PassageBlock = {
  passage: string | null;
  questions: Question[];
};

/**
 * Gộp các câu hỏi liên tiếp dùng chung 1 đoạn văn (content.passage) thành 1
 * block — dùng cho Part 6/7 (Text Completion / Reading Comprehension).
 */
export function groupQuestionsByPassage(questions: Question[]): PassageBlock[] {
  const blocks: PassageBlock[] = [];
  for (const q of questions) {
    const passage = getQuestionPassage(q);
    const last = blocks[blocks.length - 1];
    if (passage && last && last.passage === passage) {
      last.questions.push(q);
    } else {
      blocks.push({ passage, questions: [q] });
    }
  }
  return blocks;
}

export type SubmitResultLike = { questionId: number; isCorrect: boolean };

/**
 * Từ kết quả nộp bài (results[]) + danh sách câu hỏi, tính số câu đúng theo
 * kỹ năng Listening (Part 1-4) / Reading (Part 5-7) để đưa vào score-conversion.
 */
export function splitListeningReadingCorrect(
  questions: Question[],
  results: SubmitResultLike[],
): { listeningCorrect: number; readingCorrect: number; listeningTotal: number; readingTotal: number } {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  let listeningCorrect = 0;
  let readingCorrect = 0;
  let listeningTotal = 0;
  let readingTotal = 0;

  for (const q of questions) {
    const part = getQuestionPart(q);
    const skill = part ? PART_META[part].skill : null;
    if (skill === "listening") listeningTotal++;
    else if (skill === "reading") readingTotal++;
  }

  for (const res of results) {
    const question = questionById.get(res.questionId);
    if (!question) continue;
    const part = getQuestionPart(question);
    const skill = part ? PART_META[part].skill : null;
    if (skill === "listening" && res.isCorrect) listeningCorrect++;
    else if (skill === "reading" && res.isCorrect) readingCorrect++;
  }

  return { listeningCorrect, readingCorrect, listeningTotal, readingTotal };
}

/** Nhãn xếp loại điểm TOEIC tổng (10-990) — chỉ mang tính tham khảo. */
export function getToeicScoreBand(totalScore: number): { label: string; colorVar: string } {
  if (totalScore >= 860) return { label: "Advanced", colorVar: "var(--color-success)" };
  if (totalScore >= 605) return { label: "Upper-Intermediate", colorVar: "var(--color-primary)" };
  if (totalScore >= 405) return { label: "Intermediate", colorVar: "var(--color-warning)" };
  return { label: "Elementary", colorVar: "var(--color-accent)" };
}
