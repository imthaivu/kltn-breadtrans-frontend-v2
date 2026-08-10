"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { speakingApi } from "@/lib/api/services";
import type { SpeakingExercise } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiMic, FiSquare } from "react-icons/fi";

export default function SpeakingPage() {
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
      <div>
        <h1 className="text-2xl font-bold">Speaking</h1>
        <p className="text-sm text-muted">
          Ghi âm phát âm hoặc nộp bài Part 3–5 dạng văn bản.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="TOEIC">TOEIC</option>
            <option value="IELTS">IELTS</option>
            <option value="GENERAL">GENERAL</option>
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
              onClick={() => {
                setSelected(ex);
                setResult(null);
                setBlob(null);
              }}
            >
              <Card
                className={
                  selected?.id === ex.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary"
                }
              >
                <CardTitle className="text-base">{ex.title}</CardTitle>
                <CardDescription>
                  {ex.category || "Exercise"}
                  {ex.difficulty ? ` · ${ex.difficulty}` : ""} —{" "}
                  {(ex.targetText || ex.promptText || "").slice(0, 80)}
                </CardDescription>
              </Card>
            </button>
          ))}
        </div>
      )}

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
        <Card className="border-primary/40 bg-primary/5">
          <CardTitle className="text-base">Kết quả</CardTitle>
          <pre className="mt-2 max-h-80 overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}

      <Card>
        <CardTitle className="text-base">Lịch sử của tôi</CardTitle>
        <pre className="mt-2 max-h-60 overflow-auto text-xs text-muted">
          {historyQ.isLoading
            ? "Đang tải..."
            : JSON.stringify(historyQ.data ?? [], null, 2)}
        </pre>
      </Card>
    </div>
  );
}
