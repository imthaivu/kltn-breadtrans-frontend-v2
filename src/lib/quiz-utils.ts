import type { Question } from "@/lib/api/types";

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
