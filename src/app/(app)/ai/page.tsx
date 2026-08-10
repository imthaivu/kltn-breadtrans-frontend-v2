"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { RequireRole } from "@/components/layout/RequireAuth";
import { aiApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [topic, setTopic] = useState("Business");
  const [part, setPart] = useState("5");
  const [count, setCount] = useState(5);
  const [dictationTopic, setDictationTopic] = useState("daily life");
  const [dictationCount, setDictationCount] = useState(5);
  const [genResult, setGenResult] = useState<unknown>(null);
  const [explain, setExplain] = useState({
    questionId: 1,
    questionContent: "",
    userAnswer: "",
    correctAnswer: "",
  });
  const [explainResult, setExplainResult] = useState<unknown>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<unknown>(null);

  const chat = useMutation({
    mutationFn: () => aiApi.chat(prompt),
    onSuccess: (data) => {
      setChatReply(data?.reply ?? JSON.stringify(data));
      toast.success("AI đã trả lời");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const dictation = useMutation({
    mutationFn: () =>
      aiApi.generateDictation({
        topic: dictationTopic,
        count: dictationCount,
      }),
    onSuccess: (data) => {
      setGenResult(data);
      toast.success("Đã tạo dictation quiz");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toeic = useMutation({
    mutationFn: () =>
      aiApi.generateToeicQuiz({ topic, part, count }),
    onSuccess: (data) => {
      setGenResult(data);
      toast.success("Đã tạo TOEIC quiz");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const explainMut = useMutation({
    mutationFn: () =>
      aiApi.explainError(explain.questionId, {
        questionContent: explain.questionContent,
        userAnswer: explain.userAnswer,
        correctAnswer: explain.correctAnswer,
      }),
    onSuccess: (data) => {
      setExplainResult(data);
      toast.success("Đã giải thích");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const importMut = useMutation({
    mutationFn: () => {
      if (!pdfFile) throw new Error("Chọn file PDF");
      return aiApi.importEtsPdf(pdfFile, audioFile || undefined);
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast.success("Import ETS thành công");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Hub</h1>
        <p className="text-sm text-muted">
          Chat tutor, tạo đề, giải thích lỗi, import ETS PDF.
        </p>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Chat tutor</CardTitle>
        <Textarea
          label="Câu hỏi"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Giải thích thì hiện tại hoàn thành..."
        />
        <Button
          loading={chat.isPending}
          disabled={!prompt.trim()}
          onClick={() => chat.mutate()}
        >
          Gửi
        </Button>
        {chatReply ? (
          <div className="rounded-md bg-surface p-3 text-sm whitespace-pre-wrap">
            {chatReply}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="text-base">Generate dictation</CardTitle>
          <Input
            label="Topic"
            value={dictationTopic}
            onChange={(e) => setDictationTopic(e.target.value)}
          />
          <Input
            label="Số câu"
            type="number"
            min={1}
            max={20}
            value={dictationCount}
            onChange={(e) => setDictationCount(Number(e.target.value))}
          />
          <Button loading={dictation.isPending} onClick={() => dictation.mutate()}>
            Tạo listening practice
          </Button>
        </Card>
        <Card className="space-y-3">
          <CardTitle className="text-base">Generate TOEIC quiz</CardTitle>
          <Input
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Select
            label="Part"
            value={part}
            onChange={(e) => setPart(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <option key={p} value={p}>
                Part {p}
              </option>
            ))}
          </Select>
          <Input
            label="Số câu"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <Button loading={toeic.isPending} onClick={() => toeic.mutate()}>
            Tạo câu hỏi
          </Button>
        </Card>
      </div>

      {genResult ? (
        <Card>
          <CardTitle className="text-base">Kết quả generate</CardTitle>
          <pre className="mt-2 max-h-80 overflow-auto text-xs whitespace-pre-wrap">
            {JSON.stringify(genResult, null, 2)}
          </pre>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <CardTitle className="text-base">Giải thích lỗi TOEIC</CardTitle>
        <Input
          label="Question ID"
          type="number"
          value={explain.questionId}
          onChange={(e) =>
            setExplain((s) => ({ ...s, questionId: Number(e.target.value) }))
          }
        />
        <Textarea
          label="Nội dung câu hỏi"
          value={explain.questionContent}
          onChange={(e) =>
            setExplain((s) => ({ ...s, questionContent: e.target.value }))
          }
        />
        <Input
          label="Đáp án của bạn"
          value={explain.userAnswer}
          onChange={(e) =>
            setExplain((s) => ({ ...s, userAnswer: e.target.value }))
          }
        />
        <Input
          label="Đáp án đúng"
          value={explain.correctAnswer}
          onChange={(e) =>
            setExplain((s) => ({ ...s, correctAnswer: e.target.value }))
          }
        />
        <Button loading={explainMut.isPending} onClick={() => explainMut.mutate()}>
          Giải thích
        </Button>
        {explainResult ? (
          <pre className="max-h-60 overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(explainResult, null, 2)}
          </pre>
        ) : null}
      </Card>

      <RequireRole roles={["TEACHER", "ADMIN"]}>
        <Card className="space-y-3">
          <CardTitle className="text-base">Import ETS PDF (Teacher)</CardTitle>
          <label className="text-sm">
            PDF đề thi
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 block w-full text-sm"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm">
            Audio (tuỳ chọn)
            <input
              type="file"
              accept="audio/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            loading={importMut.isPending}
            disabled={!pdfFile}
            onClick={() => importMut.mutate()}
          >
            Import
          </Button>
          {importResult ? (
            <pre className="max-h-60 overflow-auto text-xs">
              {JSON.stringify(importResult, null, 2)}
            </pre>
          ) : null}
        </Card>
      </RequireRole>
    </div>
  );
}
