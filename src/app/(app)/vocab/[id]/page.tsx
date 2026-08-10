"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { vocabApi } from "@/lib/api/services";
import type { VocabWord } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft, FiStar } from "react-icons/fi";

type Mode = "flashcard" | "quiz" | "list";

export default function VocabTopicPage() {
  const params = useParams<{ id: string }>();
  const topicId = Number(params.id);
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("flashcard");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");

  const q = useQuery({
    queryKey: ["vocab", "topic", topicId],
    queryFn: () => vocabApi.topic(topicId),
    enabled: Number.isFinite(topicId),
  });

  const action = useMutation({
    mutationFn: async ({
      wordId,
      type,
      isCorrect,
    }: {
      wordId: number;
      type: "star" | "master" | "review";
      isCorrect?: boolean;
    }) => {
      if (type === "star") return vocabApi.star(wordId);
      if (type === "master") return vocabApi.master(wordId);
      return vocabApi.review(wordId, Boolean(isCorrect));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vocab", "topic", topicId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const words: VocabWord[] = useMemo(() => {
    const d = q.data as
      | { words?: VocabWord[]; vocabWords?: VocabWord[]; title?: string; name?: string }
      | undefined;
    if (!d) return [];
    return d.words ?? d.vocabWords ?? [];
  }, [q.data]);

  const title =
    (q.data as { title?: string; name?: string } | undefined)?.title ||
    (q.data as { name?: string } | undefined)?.name ||
    `Topic #${topicId}`;

  const ipa = (w: VocabWord) =>
    w.ipaUs || w.ipaUk || w.phonetic || "";
  const example = (w: VocabWord) =>
    w.exampleEn || w.example || w.exampleVi || "";
  const audio = (w: VocabWord) => w.audioUs || w.audioUk || w.audioUrl || "";

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;
  if (words.length === 0) {
    return (
      <div className="space-y-4">
        <Link href="/vocab" className="inline-flex items-center gap-1 text-sm text-primary">
          <FiArrowLeft /> Quay lại
        </Link>
        <EmptyState title="Chủ đề chưa có từ" />
      </div>
    );
  }

  const word = words[Math.min(index, words.length - 1)];

  function next() {
    setFlipped(false);
    setAnswer("");
    setIndex((i) => (i + 1) % words.length);
  }

  function checkQuiz() {
    const ok =
      answer.trim().toLowerCase() ===
      String(word.word || "").trim().toLowerCase();
    action.mutate({ wordId: word.id, type: "review", isCorrect: ok });
    toast[ok ? "success" : "error"](ok ? "Đúng!" : `Sai — đáp án: ${word.word}`);
    if (ok) setTimeout(next, 600);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/vocab"
            className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
          >
            <FiArrowLeft /> Từ vựng
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted">
            {words.length} từ · #{index + 1}
          </p>
        </div>
        <div className="flex gap-2">
          {(["flashcard", "quiz", "list"] as Mode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "primary" : "outline"}
              onClick={() => {
                setMode(m);
                setFlipped(false);
                setAnswer("");
              }}
            >
              {m === "flashcard"
                ? "Flashcard"
                : m === "quiz"
                  ? "Quiz"
                  : "Danh sách"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "list" ? (
        <div className="space-y-2">
          {words.map((w) => (
            <Card
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold">
                  {w.word}{" "}
                  {ipa(w) ? (
                    <span className="text-sm font-normal text-muted">
                      {ipa(w)}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-muted">{w.meaning}</div>
                {example(w) ? (
                  <div className="mt-1 text-xs italic text-muted">
                    {example(w)}
                  </div>
                ) : null}
                {audio(w) ? (
                  <audio controls src={audio(w)} className="mt-2 h-8 w-48" />
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    action.mutate({ wordId: w.id, type: "star" })
                  }
                >
                  <FiStar
                    className={w.isStarred ? "fill-secondary text-secondary" : ""}
                  />
                </Button>
                <Button
                  size="sm"
                  variant={w.isMastered ? "secondary" : "outline"}
                  onClick={() =>
                    action.mutate({ wordId: w.id, type: "master" })
                  }
                >
                  Master
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {mode === "flashcard" ? (
        <div className="mx-auto max-w-lg space-y-4">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-border bg-white p-8 text-center shadow-md transition hover:border-primary"
          >
            {!flipped ? (
              <>
                <div className="text-3xl font-bold text-primary">{word.word}</div>
                {ipa(word) ? (
                  <div className="mt-2 text-muted">{ipa(word)}</div>
                ) : null}
                {audio(word) ? (
                  <audio
                    controls
                    src={audio(word)}
                    className="mt-3"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : null}
                <p className="mt-6 text-xs text-muted">Chạm để lật</p>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold">{word.meaning}</div>
                {example(word) ? (
                  <p className="mt-3 text-sm italic text-muted">
                    {example(word)}
                  </p>
                ) : null}
              </>
            )}
          </button>
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() =>
                action.mutate({
                  wordId: word.id,
                  type: "review",
                  isCorrect: false,
                })
              }
            >
              Chưa thuộc
            </Button>
            <Button onClick={next}>Tiếp</Button>
            <Button
              variant="secondary"
              onClick={() => {
                action.mutate({
                  wordId: word.id,
                  type: "review",
                  isCorrect: true,
                });
                next();
              }}
            >
              Đã thuộc
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "quiz" ? (
        <div className="mx-auto max-w-lg space-y-4">
          <Card>
            <p className="text-sm text-muted">Nghĩa tiếng Việt</p>
            <p className="mt-2 text-xl font-semibold">{word.meaning}</p>
            <input
              className="mt-4 w-full rounded-md border-2 border-border px-3 py-2 outline-none focus:border-primary"
              placeholder="Gõ từ tiếng Anh..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") checkQuiz();
              }}
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={checkQuiz} loading={action.isPending}>
                Kiểm tra
              </Button>
              <Button variant="outline" onClick={next}>
                Bỏ qua
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
