"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { writingApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type Tab = "part1" | "part2" | "part3";

export default function WritingPage() {
  const [tab, setTab] = useState<Tab>("part1");
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [emailPrompt, setEmailPrompt] = useState("");
  const [userResponse, setUserResponse] = useState("");
  const [essayTopic, setEssayTopic] = useState("");
  const [userEssay, setUserEssay] = useState("");
  const [result, setResult] = useState<unknown>(null);

  const topicsQ = useQuery({
    queryKey: ["writing", "topics"],
    queryFn: () => writingApi.topics(),
  });

  const quizQ = useQuery({
    queryKey: ["writing", "quiz", selectedQuizId],
    queryFn: () => writingApi.quiz(selectedQuizId!),
    enabled: selectedQuizId != null,
  });

  const communityQ = useQuery({
    queryKey: ["writing", "community", selectedQuizId],
    queryFn: () => writingApi.community(selectedQuizId!),
    enabled: selectedQuizId != null,
  });

  const topics = useMemo(() => {
    const raw = topicsQ.data;
    // Backend: { categories, quizzes: [{ id, topicId, topicName, imageUrl, keywords }] }
    if (raw && typeof raw === "object" && Array.isArray((raw as { quizzes?: unknown }).quizzes)) {
      return (raw as {
        quizzes: {
          id: number;
          topicName?: string;
          imageUrl?: string;
          keywords?: string[];
        }[];
      }).quizzes.map((q) => ({
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

  const submit = useMutation({
    mutationFn: async () => {
      if (tab === "part1") {
        if (!selectedQuizId) throw new Error("Chọn đề Part 1");
        return writingApi.submitPart1(selectedQuizId, answer);
      }
      if (tab === "part2") {
        return writingApi.submitPart2(emailPrompt, userResponse);
      }
      return writingApi.submitPart3(essayTopic, userEssay);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Đã gửi — AI đang phản hồi");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Writing</h1>
        <p className="text-sm text-muted">
          TOEIC Writing Part 1 (ảnh), Part 2 (email), Part 3 (essay) — chấm bằng AI.
        </p>
      </div>

      <div className="flex gap-2">
        {(["part1", "part2", "part3"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "primary" : "outline"}
            onClick={() => {
              setTab(t);
              setResult(null);
            }}
          >
            {t === "part1" ? "Part 1" : t === "part2" ? "Part 2" : "Part 3"}
          </Button>
        ))}
      </div>

      {tab === "part1" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-semibold">Chọn đề</h2>
            {topicsQ.isLoading ? (
              <PageLoading />
            ) : topicsQ.isError ? (
              <ErrorState message={getErrorMessage(topicsQ.error)} />
            ) : topics.length === 0 ? (
              <EmptyState title="Chưa có đề Writing Part 1" />
            ) : (
              topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuizId(t.id);
                    setResult(null);
                  }}
                  className="w-full text-left"
                >
                  <Card
                    className={
                      selectedQuizId === t.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary"
                    }
                  >
                    <CardTitle className="text-base">
                      {t.title}
                    </CardTitle>
                    {"imageUrl" in t && t.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(t.imageUrl)}
                        alt=""
                        className="mt-2 max-h-28 rounded-md object-cover"
                      />
                    ) : null}
                  </Card>
                </button>
              ))
            )}
          </div>
          <div className="space-y-3">
            {quizQ.data ? (
              <Card>
                <CardTitle className="text-base">Đề bài</CardTitle>
                {"imageUrl" in (quizQ.data as object) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={String((quizQ.data as { imageUrl?: string }).imageUrl)}
                    alt=""
                    className="mt-3 max-h-56 rounded-md object-contain"
                  />
                ) : null}
                {"keywords" in (quizQ.data as object) ? (
                  <p className="mt-2 text-sm text-muted">
                    Keywords:{" "}
                    {(
                      (quizQ.data as { keywords?: string[] }).keywords ?? []
                    ).join(", ")}
                  </p>
                ) : (
                  <CardDescription className="mt-2 whitespace-pre-wrap">
                    {JSON.stringify(quizQ.data, null, 2).slice(0, 800)}
                  </CardDescription>
                )}
              </Card>
            ) : null}
            <Textarea
              label="Câu trả lời của bạn"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Viết mô tả tranh..."
            />
            <Button
              loading={submit.isPending}
              onClick={() => submit.mutate()}
              disabled={!selectedQuizId || !answer.trim()}
            >
              Nộp & chấm AI
            </Button>
            {communityQ.data ? (
              <Card>
                <CardTitle className="text-base">Community</CardTitle>
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-muted">
                  {JSON.stringify(communityQ.data, null, 2)}
                </pre>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "part2" ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <Textarea
            label="Email prompt"
            value={emailPrompt}
            onChange={(e) => setEmailPrompt(e.target.value)}
          />
          <Textarea
            label="Phản hồi của bạn"
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
          />
          <Button
            loading={submit.isPending}
            onClick={() => submit.mutate()}
            disabled={!emailPrompt.trim() || !userResponse.trim()}
          >
            Nộp Part 2
          </Button>
        </div>
      ) : null}

      {tab === "part3" ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <Textarea
            label="Chủ đề essay"
            value={essayTopic}
            onChange={(e) => setEssayTopic(e.target.value)}
          />
          <Textarea
            label="Bài viết"
            value={userEssay}
            onChange={(e) => setUserEssay(e.target.value)}
            className="min-h-48"
          />
          <Button
            loading={submit.isPending}
            onClick={() => submit.mutate()}
            disabled={!essayTopic.trim() || !userEssay.trim()}
          >
            Nộp Part 3
          </Button>
        </div>
      ) : null}

      {result ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardTitle className="text-base">Kết quả AI</CardTitle>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm">
            {typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
