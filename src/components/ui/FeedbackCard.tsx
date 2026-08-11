import { Card, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

export function FeedbackCard({
  title = "Kết quả AI chấm bài",
  score,
  maxScore,
  feedback,
  suggestions,
}: {
  title?: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
  suggestions?: string[];
}) {
  return (
    <Card className="space-y-3 border-primary/30 bg-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {score != null ? (
          <Tag variant="primary" className="text-sm">
            {score}
            {maxScore != null ? `/${maxScore}` : ""} điểm
          </Tag>
        ) : null}
      </div>
      {feedback ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{feedback}</p>
      ) : null}
      {suggestions && suggestions.length > 0 ? (
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Gợi ý cải thiện
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
