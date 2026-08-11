"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { FeedbackCard } from "@/components/ui/FeedbackCard";
import { Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { writingApi } from "@/lib/api/services";
import { cn, getErrorMessage, parseFeedbackResult } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

type Tab = "part1" | "part2" | "part3";
type Step = "pick" | "write";

/** Đề mẫu Part 2 — BE chưa có bank đề, FE cung cấp để học viên chọn rồi mới viết */
const PART2_PROMPTS = [
  {
    id: "p2-1",
    title: "Meeting reschedule",
    prompt:
      "From: Alex Chen <alex.chen@example.com>\nTo: You\nSubject: Project meeting next week\n\nHi,\n\nCould we move our project meeting from Tuesday to Thursday afternoon? Also, please bring the latest sales figures and confirm whether the client will join remotely.\n\nThanks,\nAlex",
  },
  {
    id: "p2-2",
    title: "Office supply request",
    prompt:
      "From: HR Desk <hr@example.com>\nTo: You\nSubject: Office supplies\n\nHello,\n\nPlease reply with the list of office supplies your team needs for next month, including quantity. Also indicate if anything is urgent.\n\nBest regards,\nHR",
  },
  {
    id: "p2-3",
    title: "Customer complaint",
    prompt:
      "From: Jordan Lee <jordan.lee@client.com>\nTo: You\nSubject: Delayed shipment\n\nHi,\n\nMy order #48219 was supposed to arrive last Friday but is still missing. Can you explain the delay and tell me when I will receive it? I would also like to know about a refund or discount option.\n\nJordan",
  },
];

/** Đề mẫu Part 3 */
const PART3_TOPICS = [
  {
    id: "p3-1",
    title: "Remote work",
    topic:
      "Do you agree or disagree with the following statement?\n\n\"Working from home is more productive than working in an office.\"\n\nGive reasons and examples to support your opinion. Write about 300 words.",
  },
  {
    id: "p3-2",
    title: "Technology in education",
    topic:
      "Some people believe technology improves education, while others think it distracts students.\n\nWhich view do you agree with? Explain your position with reasons and examples.",
  },
  {
    id: "p3-3",
    title: "City vs countryside",
    topic:
      "Is it better to live in a large city or in the countryside?\n\nDiscuss both sides and give your own opinion. Support your answer with reasons.",
  },
];

export default function WritingPage() {
  const [tab, setTab] = useState<Tab>("part1");
  const [step, setStep] = useState<Step>("pick");

  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");

  const [part2Id, setPart2Id] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState("");

  const [part3Id, setPart3Id] = useState<string | null>(null);
  const [userEssay, setUserEssay] = useState("");

  const [result, setResult] = useState<unknown>(null);

  const topicsQ = useQuery({
    queryKey: ["writing", "topics"],
    queryFn: () => writingApi.topics(),
  });

  const quizQ = useQuery({
    queryKey: ["writing", "quiz", selectedQuizId],
    queryFn: () => writingApi.quiz(selectedQuizId!),
    enabled: tab === "part1" && selectedQuizId != null && step === "write",
  });

  const communityQ = useQuery({
    queryKey: ["writing", "community", selectedQuizId],
    queryFn: () => writingApi.community(selectedQuizId!),
    enabled: tab === "part1" && selectedQuizId != null && step === "write",
  });

  const topics = useMemo(() => {
    const raw = topicsQ.data;
    if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as { quizzes?: unknown }).quizzes)
    ) {
      return (
        raw as {
          quizzes: {
            id: number;
            topicName?: string;
            imageUrl?: string;
            keywords?: string[];
          }[];
        }
      ).quizzes.map((q) => ({
        id: q.id,
        title: q.topicName || `Quiz #${q.id}`,
        imageUrl: q.imageUrl,
        keywords: q.keywords,
      }));
    }
    if (Array.isArray(raw)) {
      return (raw as { id: number; title?: string; name?: string }[]).map(
        (t) => ({
          id: t.id,
          title: t.title || t.name || `Quiz #${t.id}`,
        }),
      );
    }
    return [] as {
      id: number;
      title: string;
      imageUrl?: string;
      keywords?: string[];
    }[];
  }, [topicsQ.data]);

  const selectedPart2 = PART2_PROMPTS.find((p) => p.id === part2Id) ?? null;
  const selectedPart3 = PART3_TOPICS.find((p) => p.id === part3Id) ?? null;

  function resetForTab(next: Tab) {
    setTab(next);
    setStep("pick");
    setResult(null);
    setAnswer("");
    setUserResponse("");
    setUserEssay("");
    setSelectedQuizId(null);
    setPart2Id(null);
    setPart3Id(null);
  }

  function backToPick() {
    setStep("pick");
    setResult(null);
    setAnswer("");
    setUserResponse("");
    setUserEssay("");
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (tab === "part1") {
        if (!selectedQuizId) throw new Error("Chọn đề Part 1");
        return writingApi.submitPart1(selectedQuizId, answer);
      }
      if (tab === "part2") {
        if (!selectedPart2) throw new Error("Chọn đề Part 2");
        return writingApi.submitPart2(selectedPart2.prompt, userResponse);
      }
      if (!selectedPart3) throw new Error("Chọn đề Part 3");
      return writingApi.submitPart3(selectedPart3.topic, userEssay);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Đã gửi — AI đang phản hồi");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const canSubmit =
    tab === "part1"
      ? Boolean(selectedQuizId && answer.trim())
      : tab === "part2"
        ? Boolean(selectedPart2 && userResponse.trim())
        : Boolean(selectedPart3 && userEssay.trim());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Writing"
        description="TOEIC Writing Part 1–3 — chọn đề trước, rồi mới viết bài để AI chấm."
      />

      <div className="flex gap-2">
        {(["part1", "part2", "part3"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "primary" : "outline"}
            onClick={() => resetForTab(t)}
          >
            {t === "part1" ? "Part 1" : t === "part2" ? "Part 2" : "Part 3"}
          </Button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            step === "pick"
              ? "bg-primary text-white"
              : "bg-primary/10 text-primary",
          )}
        >
          1. Chọn đề
        </span>
        <span className="text-muted">→</span>
        <span
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            step === "write"
              ? "bg-primary text-white"
              : "bg-surface text-muted border border-border",
          )}
        >
          2. Viết bài
        </span>
      </div>

      {/* ── STEP: PICK ── */}
      {step === "pick" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Chọn đề bài</h2>

          {tab === "part1" ? (
            topicsQ.isLoading ? (
              <PageLoading />
            ) : topicsQ.isError ? (
              <ErrorState message={getErrorMessage(topicsQ.error)} />
            ) : topics.length === 0 ? (
              <EmptyState title="Chưa có đề Writing Part 1" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setSelectedQuizId(t.id);
                      setStep("write");
                      setResult(null);
                      setAnswer("");
                    }}
                  >
                    <Card className="h-full transition hover:border-primary hover:shadow-md">
                      <CardTitle>{t.title}</CardTitle>
                      {"imageUrl" in t && t.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={String(t.imageUrl)}
                          alt=""
                          className="mt-3 max-h-36 w-full rounded-[var(--radius-control)] object-cover"
                        />
                      ) : (
                        <CardDescription>Part 1 — mô tả tranh</CardDescription>
                      )}
                    </Card>
                  </button>
                ))}
              </div>
            )
          ) : null}

          {tab === "part2" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PART2_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPart2Id(p.id);
                    setStep("write");
                    setResult(null);
                    setUserResponse("");
                  }}
                >
                  <Card className="h-full transition hover:border-primary hover:shadow-md">
                    <CardTitle>{p.title}</CardTitle>
                    <CardDescription className="line-clamp-4 whitespace-pre-line">
                      {p.prompt}
                    </CardDescription>
                  </Card>
                </button>
              ))}
            </div>
          ) : null}

          {tab === "part3" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PART3_TOPICS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPart3Id(p.id);
                    setStep("write");
                    setResult(null);
                    setUserEssay("");
                  }}
                >
                  <Card className="h-full transition hover:border-primary hover:shadow-md">
                    <CardTitle>{p.title}</CardTitle>
                    <CardDescription className="line-clamp-4 whitespace-pre-line">
                      {p.topic}
                    </CardDescription>
                  </Card>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── STEP: WRITE ── */}
      {step === "write" ? (
        <section className="mx-auto max-w-3xl space-y-5">
          <button
            type="button"
            onClick={backToPick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FiArrowLeft className="h-4 w-4" />
            Đổi đề khác
          </button>

          {/* Đề — chỉ đọc */}
          <Card className="space-y-2 bg-surface/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Đề bài
            </p>
            {tab === "part1" ? (
              quizQ.isLoading ? (
                <PageLoading label="Đang tải đề..." />
              ) : quizQ.isError ? (
                <ErrorState message={getErrorMessage(quizQ.error)} />
              ) : quizQ.data ? (
                <>
                  <CardTitle>
                    {topics.find((t) => t.id === selectedQuizId)?.title ||
                      "Part 1"}
                  </CardTitle>
                  {"imageUrl" in (quizQ.data as object) &&
                  (quizQ.data as { imageUrl?: string }).imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={String(
                        (quizQ.data as { imageUrl?: string }).imageUrl,
                      )}
                      alt="Đề Part 1"
                      className="mt-2 max-h-72 w-full rounded-[var(--radius-control)] object-contain bg-white"
                    />
                  ) : null}
                  {"keywords" in (quizQ.data as object) ? (
                    <p className="text-sm text-muted">
                      Keywords:{" "}
                      {(
                        (quizQ.data as { keywords?: string[] }).keywords ?? []
                      ).join(", ")}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted">
                    Viết một hoặc hai câu mô tả bức tranh.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Không tải được đề.</p>
              )
            ) : null}

            {tab === "part2" && selectedPart2 ? (
              <>
                <CardTitle>{selectedPart2.title}</CardTitle>
                <pre className="whitespace-pre-wrap rounded-[var(--radius-control)] border border-border bg-white p-4 text-sm leading-relaxed text-foreground">
                  {selectedPart2.prompt}
                </pre>
                <p className="text-sm text-muted">
                  Đọc email trên rồi viết thư trả lời (respond to an email).
                </p>
              </>
            ) : null}

            {tab === "part3" && selectedPart3 ? (
              <>
                <CardTitle>{selectedPart3.title}</CardTitle>
                <pre className="whitespace-pre-wrap rounded-[var(--radius-control)] border border-border bg-white p-4 text-sm leading-relaxed text-foreground">
                  {selectedPart3.topic}
                </pre>
                <p className="text-sm text-muted">
                  Viết bài luận nêu quan điểm (khoảng 300 từ).
                </p>
              </>
            ) : null}
          </Card>

          {/* Bài làm — tách riêng */}
          <Card className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Bài làm của bạn
            </p>
            {tab === "part1" ? (
              <Textarea
                label="Câu trả lời"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Viết mô tả tranh..."
                className="min-h-36"
              />
            ) : null}
            {tab === "part2" ? (
              <Textarea
                label="Email trả lời"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={"Dear ...,\n\n..."}
                className="min-h-48"
              />
            ) : null}
            {tab === "part3" ? (
              <Textarea
                label="Bài luận"
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="Start your essay here..."
                className="min-h-56"
              />
            ) : null}
            <Button
              loading={submit.isPending}
              disabled={!canSubmit}
              onClick={() => submit.mutate()}
            >
              Nộp & chấm AI
            </Button>
          </Card>

          {tab === "part1" && Array.isArray(communityQ.data) && communityQ.data.length > 0 ? (
            <Card className="space-y-3">
              <CardTitle>Bài của cộng đồng</CardTitle>
              <div className="max-h-72 space-y-2 overflow-auto">
                {communityQ.data.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-1 rounded-[var(--radius-control)] bg-surface px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {item.user || "Học viên"}
                      </span>
                      {typeof item.score === "number" ? (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {item.score} điểm
                        </span>
                      ) : null}
                    </div>
                    {item.answer ? (
                      <p className="whitespace-pre-wrap text-foreground/90">{item.answer}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {result ? (
            typeof result === "string" ? (
              <FeedbackCard title="Kết quả AI" feedback={result} />
            ) : (
              <FeedbackCard title="Kết quả AI" {...parseFeedbackResult(result)} />
            )
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
