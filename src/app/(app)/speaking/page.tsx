"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { FeedbackCard } from "@/components/ui/FeedbackCard";
import { Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tag } from "@/components/ui/Tag";
import { speakingApi } from "@/lib/api/services";
import type { SpeakingExercise } from "@/lib/api/types";
import { getErrorMessage, parseFeedbackResult } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiClock, FiMic, FiSquare } from "react-icons/fi";

export default function SpeakingPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SpeakingPageInner />
    </Suspense>
  );
}

function SpeakingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseIdParam = searchParams.get("id");
  const exerciseId =
    exerciseIdParam && /^\d+$/.test(exerciseIdParam)
      ? Number(exerciseIdParam)
      : null;

  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<SpeakingExercise | null>(null);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [promptText, setPromptText] = useState("");
  const [studentResponse, setStudentResponse] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["speaking", "exercises", category],
    queryFn: () => speakingApi.list(category || undefined),
  });

  const detailQ = useQuery({
    queryKey: ["speaking", "exercises", "detail", exerciseId],
    queryFn: () => speakingApi.get(exerciseId!),
    enabled: exerciseId != null,
  });

  useEffect(() => {
    if (detailQ.data) {
      setSelected(detailQ.data);
    }
  }, [detailQ.data]);

  useEffect(() => {
    if (detailQ.isError) {
      toast.error(getErrorMessage(detailQ.error));
    }
  }, [detailQ.isError, detailQ.error]);

  const historyQ = useQuery({
    queryKey: ["speaking", "my-submissions"],
    queryFn: () => speakingApi.mySubmissions(),
  });

  const submitAudio = useMutation({
    mutationFn: async () => {
      if (!selected || !blob) throw new Error("Chọn bài và ghi âm trước");
      return speakingApi.submitAudio(selected.id, blob);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Đã gửi audio");
      void qc.invalidateQueries({ queryKey: ["speaking", "my-submissions"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const submitText = useMutation({
    mutationFn: () => speakingApi.submitPart35(promptText, studentResponse),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Đã chấm Part 3–5");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function selectExercise(ex: SpeakingExercise) {
    setSelected(ex);
    setResult(null);
    setBlob(null);
    router.replace(`/speaking?id=${ex.id}`, { scroll: false });
  }

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Không mở được micro");
    }
  }

  function stopRecord() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  const exercises: SpeakingExercise[] = Array.isArray(listQ.data)
    ? listQ.data
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Speaking"
        description="Ghi âm phát âm hoặc nộp bài Part 3–5 dạng văn bản — AI chấm và phản hồi."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="TOEIC">TOEIC</option>
            <option value="GENERAL">Luyện tập chung</option>
          </Select>
        </div>
      </div>

      {listQ.isLoading ? (
        <PageLoading />
      ) : listQ.isError ? (
        <ErrorState message={getErrorMessage(listQ.error)} />
      ) : exercises.length === 0 ? (
        <EmptyState title="Chưa có bài speaking" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="text-left"
              onClick={() => selectExercise(ex)}
            >
              <Card
                className={
                  selected?.id === ex.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary"
                }
              >
                <CardTitle className="text-base">{ex.title}</CardTitle>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Tag variant="primary">{ex.category || "Exercise"}</Tag>
                  {ex.difficulty ? (
                    <Tag variant="outline">{ex.difficulty}</Tag>
                  ) : null}
                </div>
                <CardDescription>
                  {(ex.targetText || ex.promptText || "").slice(0, 80)}
                </CardDescription>
              </Card>
            </button>
          ))}
        </div>
      )}

      {exerciseId != null && detailQ.isLoading && !selected ? (
        <PageLoading label="Đang tải bài speaking..." />
      ) : null}

      {selected ? (
        <Card className="space-y-4">
          <div>
            <CardTitle>{selected.title}</CardTitle>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {selected.targetText || selected.promptText}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!recording ? (
              <Button onClick={() => void startRecord()}>
                <FiMic /> Ghi âm
              </Button>
            ) : (
              <Button variant="danger" onClick={stopRecord}>
                <FiSquare /> Dừng
              </Button>
            )}
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setBlob(f);
                }}
              />
              <span className="rounded-md border-2 border-border px-4 py-2 text-sm hover:bg-surface">
                Upload audio
              </span>
            </label>
            <Button
              loading={submitAudio.isPending}
              disabled={!blob}
              onClick={() => submitAudio.mutate()}
            >
              Nộp & chấm AI
            </Button>
          </div>
          {blob ? (
            <audio
              controls
              src={URL.createObjectURL(blob)}
              className="w-full"
            />
          ) : null}
        </Card>
      ) : null}

      <Card className="space-y-3">
        <CardTitle className="text-base">Speaking Part 3–5 (text)</CardTitle>
        <Textarea
          label="Prompt"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
        />
        <Textarea
          label="Câu trả lời"
          value={studentResponse}
          onChange={(e) => setStudentResponse(e.target.value)}
        />
        <Button
          loading={submitText.isPending}
          disabled={!promptText.trim() || !studentResponse.trim()}
          onClick={() => submitText.mutate()}
        >
          Chấm Part 3–5
        </Button>
      </Card>

      {result ? (
        (() => {
          const r = result as Record<string, unknown>;
          const assessment =
            r.assessment && typeof r.assessment === "object"
              ? (r.assessment as Record<string, unknown>)
              : null;
          if (assessment) {
            const overall =
              typeof assessment.overallScore === "number"
                ? assessment.overallScore
                : typeof r.overallScore === "number"
                  ? (r.overallScore as number)
                  : undefined;
            return (
              <FeedbackCard
                title="Kết quả chấm phát âm"
                score={overall}
                maxScore={overall != null ? 100 : undefined}
                feedback={
                  typeof assessment.feedback === "string"
                    ? assessment.feedback
                    : JSON.stringify(assessment, null, 2)
                }
              />
            );
          }
          return (
            <FeedbackCard
              title="Kết quả chấm bài"
              {...parseFeedbackResult(result)}
            />
          );
        })()
      ) : null}

      <Card className="space-y-3">
        <CardTitle className="text-base">Lịch sử của tôi</CardTitle>
        {historyQ.isLoading ? (
          <PageLoading label="Đang tải lịch sử..." />
        ) : historyQ.isError ? (
          <ErrorState message={getErrorMessage(historyQ.error)} />
        ) : !Array.isArray(historyQ.data) || historyQ.data.length === 0 ? (
          <EmptyState title="Chưa có lịch sử luyện tập" />
        ) : (
          <div className="max-h-72 space-y-2 overflow-auto">
            {historyQ.data.map((sub) => {
              const score = sub.overallScore ?? sub.aiFeedback?.overallScore;
              const feedback = sub.aiFeedback?.feedback;
              return (
                <div
                  key={sub.id}
                  className="space-y-1 rounded-[var(--radius-control)] bg-surface px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {sub.exercise?.title ||
                        `Bài #${sub.exerciseId ?? sub.id}`}
                    </span>
                    {typeof score === "number" ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {score} điểm
                      </span>
                    ) : null}
                  </div>
                  {sub.submittedAt ? (
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <FiClock className="h-3 w-3" />
                      {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                    </p>
                  ) : null}
                  {typeof feedback === "string" ? (
                    <p className="line-clamp-2 text-foreground/90">{feedback}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
