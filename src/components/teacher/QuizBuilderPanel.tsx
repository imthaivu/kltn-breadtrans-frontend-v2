"use client";

import { QuestionCard } from "@/components/exam/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/Loading";
import { Tag } from "@/components/ui/Tag";
import { aiApi, quizApi } from "@/lib/api/services";
import type { Course } from "@/lib/api/types";
import {
  buildQuestionContent,
  draftFromAiQuestion,
  emptyQuestionForm,
  previewQuestionFromForm,
  type QuestionFormValue,
} from "@/lib/quiz-utils";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiCpu, FiPlus, FiRefreshCw, FiUploadCloud, FiX } from "react-icons/fi";
import { QuestionBuilderForm } from "./QuestionBuilderForm";

const QUIZ_TYPES = [
  { value: "TOEIC", label: "TOEIC" },
  { value: "GENERAL", label: "Luyện tập chung" },
  { value: "LISTENING_PRACTICE", label: "Listening practice" },
  { value: "BILINGUAL_READING", label: "Reading song ngữ" },
];

/**
 * Soạn đề: tạo quiz rồi ở lại đúng quiz đó để thêm câu hỏi (không cần nhớ Quiz ID) —
 * hỗ trợ thêm tay theo form đúng kiểu, hoặc để AI sinh câu hỏi/nghe/PDF rồi soạn lại
 * trước khi lưu, thay cho việc gõ JSON hoặc dán ID thủ công.
 */
export function QuizBuilderPanel({ courses }: { courses: Course[] }) {
  const qc = useQueryClient();
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

  const [quizForm, setQuizForm] = useState({
    title: "",
    type: "TOEIC",
    description: "",
    courseId: "",
    timeLimit: "",
  });

  const [questionForm, setQuestionForm] = useState<QuestionFormValue>(emptyQuestionForm());
  const [aiTopic, setAiTopic] = useState("Office Equipment");
  const [aiPart, setAiPart] = useState(5);
  const [aiCount, setAiCount] = useState(5);
  const [aiDrafts, setAiDrafts] = useState<QuestionFormValue[]>([]);
  const [expandedDraft, setExpandedDraft] = useState<number | null>(null);
  const [dictationTopic, setDictationTopic] = useState("daily life");
  const [dictationCount, setDictationCount] = useState(5);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const activeQuizQ = useQuery({
    queryKey: ["quizzes", activeQuizId],
    queryFn: () => quizApi.get(activeQuizId as number),
    enabled: activeQuizId != null,
  });
  const existingQuestions = activeQuizQ.data?.questions ?? [];

  const createQuiz = useMutation({
    mutationFn: () =>
      quizApi.create({
        title: quizForm.title,
        type: quizForm.type,
        description: quizForm.description || undefined,
        courseId: quizForm.courseId ? Number(quizForm.courseId) : undefined,
        timeLimit: quizForm.timeLimit ? Number(quizForm.timeLimit) : undefined,
      }),
    onSuccess: (data) => {
      const id = Number((data as { id: number }).id);
      setActiveQuizId(id);
      toast.success("Đã tạo đề — soạn câu hỏi ngay bên dưới");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addQuestionMut = useMutation({
    mutationFn: (payload: { type: string; content: Record<string, unknown> }) =>
      quizApi.addQuestion(activeQuizId as number, {
        type: payload.type,
        content: payload.content,
        order: existingQuestions.length + 1,
      }),
    onSuccess: () => {
      toast.success("Đã thêm câu hỏi vào đề");
      void qc.invalidateQueries({ queryKey: ["quizzes", activeQuizId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const generateAi = useMutation({
    mutationFn: () => aiApi.generateToeicQuiz({ topic: aiTopic, part: aiPart, count: aiCount }),
    onSuccess: (data) => {
      const questions = Array.isArray((data as { questions?: unknown[] }).questions)
        ? (data as { questions: unknown[] }).questions
        : [];
      setAiDrafts((list) => [...questions.map((q) => draftFromAiQuestion(q)), ...list]);
      toast.success(`AI đã sinh ${questions.length} câu hỏi — xem lại trước khi thêm`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const generateDictation = useMutation({
    mutationFn: () => aiApi.generateDictation({ topic: dictationTopic, count: dictationCount }),
    onSuccess: (data) => {
      const quizId = Number((data as { quizId: number }).quizId);
      setActiveQuizId(quizId);
      toast.success((data as { message?: string }).message ?? "Đã tạo bài luyện nghe");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const importEts = useMutation({
    mutationFn: () => {
      if (!pdfFile) throw new Error("Chọn file PDF đề thi trước");
      return aiApi.importEtsPdf(pdfFile, audioFile || undefined);
    },
    onSuccess: (data) => {
      setActiveQuizId(data.quizId);
      setPdfFile(null);
      setAudioFile(null);
      toast.success(data.message);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  function submitManualQuestion() {
    addQuestionMut.mutate(
      { type: questionForm.type, content: buildQuestionContent(questionForm) },
      { onSuccess: () => setQuestionForm(emptyQuestionForm(questionForm.type)) },
    );
  }

  function acceptDraft(idx: number) {
    const draft = aiDrafts[idx];
    addQuestionMut.mutate(
      { type: "MULTIPLE_CHOICE", content: buildQuestionContent(draft) },
      {
        onSuccess: () => {
          setAiDrafts((list) => list.filter((_, i) => i !== idx));
          setExpandedDraft(null);
        },
      },
    );
  }

  function discardDraft(idx: number) {
    setAiDrafts((list) => list.filter((_, i) => i !== idx));
    setExpandedDraft(null);
  }

  if (activeQuizId == null) {
    return (
      <div className="space-y-4">
        <Card className="space-y-3">
          <CardTitle>Tạo đề mới</CardTitle>
          <CardDescription>
            Sau khi tạo, bạn sẽ ở lại đúng đề này để thêm câu hỏi — không cần nhớ Quiz ID.
          </CardDescription>
          <Input
            label="Tiêu đề"
            value={quizForm.title}
            onChange={(e) => setQuizForm((s) => ({ ...s, title: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Loại đề"
              value={quizForm.type}
              onChange={(e) => setQuizForm((s) => ({ ...s, type: e.target.value }))}
            >
              {QUIZ_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input
              label="Thời gian làm bài (phút, tuỳ chọn)"
              type="number"
              min={1}
              value={quizForm.timeLimit}
              onChange={(e) => setQuizForm((s) => ({ ...s, timeLimit: e.target.value }))}
            />
          </div>
          <Select
            label="Gắn với khoá học (tuỳ chọn)"
            value={quizForm.courseId}
            onChange={(e) => setQuizForm((s) => ({ ...s, courseId: e.target.value }))}
          >
            <option value="">Không gắn khoá học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Textarea
            label="Mô tả (tuỳ chọn)"
            value={quizForm.description}
            onChange={(e) => setQuizForm((s) => ({ ...s, description: e.target.value }))}
          />
          <Button
            loading={createQuiz.isPending}
            disabled={!quizForm.title.trim()}
            onClick={() => createQuiz.mutate()}
          >
            <FiPlus className="h-4 w-4" /> Tạo đề & bắt đầu soạn câu hỏi
          </Button>
        </Card>

        <Card className="space-y-3 border-primary/30 bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiCpu className="h-4 w-4 text-primary" /> Tạo nhanh bằng AI
          </CardTitle>
          <CardDescription>
            AI tự tạo và lưu sẵn 1 đề hoàn chỉnh — bạn sẽ được chuyển vào soạn tiếp ngay khi xong.
          </CardDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-[var(--radius-control)] border border-border bg-white p-3">
              <p className="text-sm font-semibold">Bài luyện nghe (dictation)</p>
              <Input
                label="Chủ đề"
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
              <Button
                size="sm"
                loading={generateDictation.isPending}
                onClick={() => generateDictation.mutate()}
              >
                Tạo bài luyện nghe
              </Button>
            </div>
            <div className="space-y-2 rounded-[var(--radius-control)] border border-border bg-white p-3">
              <p className="text-sm font-semibold">Import đề ETS (PDF)</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary">
                <FiUploadCloud className="h-4 w-4" />
                {pdfFile ? pdfFile.name : "Chọn file PDF đề thi"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary">
                <FiUploadCloud className="h-4 w-4" />
                {audioFile ? audioFile.name : "Chọn audio đi kèm (tuỳ chọn)"}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button
                size="sm"
                loading={importEts.isPending}
                disabled={!pdfFile}
                onClick={() => importEts.mutate()}
              >
                Import đề
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{activeQuizQ.data?.title ?? "Đang tải..."}</CardTitle>
            {activeQuizQ.data?.type ? <Tag variant="primary">{activeQuizQ.data.type}</Tag> : null}
            <Tag variant="outline">{existingQuestions.length} câu hỏi</Tag>
          </div>
          <CardDescription>Đang soạn đề này — mọi câu hỏi thêm bên dưới sẽ lưu vào đây.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveQuizId(null)}>
          <FiRefreshCw className="h-4 w-4" /> Tạo đề khác
        </Button>
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Câu hỏi đã có</CardTitle>
        {existingQuestions.length === 0 ? (
          <EmptyState title="Chưa có câu hỏi" description="Thêm câu hỏi ở form bên dưới hoặc dùng AI sinh câu hỏi." />
        ) : (
          <div className="space-y-3">
            {existingQuestions.map((q, i) => (
              <QuestionCard key={q.id} question={q} number={i + 1} readOnly />
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle className="text-base">Thêm câu hỏi</CardTitle>
        <QuestionBuilderForm
          value={questionForm}
          onChange={setQuestionForm}
          onSubmit={submitManualQuestion}
          loading={addQuestionMut.isPending}
          submitLabel="Thêm câu hỏi vào đề"
        />
      </Card>

      <Card className="space-y-4 border-primary/30 bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <FiCpu className="h-4 w-4 text-primary" /> AI sinh câu hỏi cho đề này
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Chủ đề" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
          <Select label="Part" value={aiPart} onChange={(e) => setAiPart(Number(e.target.value))}>
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
            value={aiCount}
            onChange={(e) => setAiCount(Number(e.target.value))}
          />
        </div>
        <Button loading={generateAi.isPending} onClick={() => generateAi.mutate()}>
          <FiCpu className="h-4 w-4" /> Sinh câu hỏi
        </Button>

        {aiDrafts.length > 0 ? (
          <div className="space-y-3 border-t border-primary/20 pt-3">
            <p className="text-sm font-medium text-foreground">
              {aiDrafts.length} câu hỏi nháp — xem lại, sửa nếu cần rồi thêm vào đề
            </p>
            {aiDrafts.map((draft, i) => (
              <Card key={i} className="space-y-3">
                {expandedDraft === i ? (
                  <QuestionBuilderForm
                    value={draft}
                    onChange={(next) =>
                      setAiDrafts((list) => list.map((d, idx) => (idx === i ? next : d)))
                    }
                    onSubmit={() => acceptDraft(i)}
                    onCancel={() => setExpandedDraft(null)}
                    submitLabel="Thêm vào đề"
                    loading={addQuestionMut.isPending}
                  />
                ) : (
                  <>
                    <QuestionCard question={previewQuestionFromForm(draft, -i - 1)} number={i + 1} readOnly />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" loading={addQuestionMut.isPending} onClick={() => acceptDraft(i)}>
                        Thêm vào đề
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setExpandedDraft(i)}>
                        Sửa trước khi thêm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => discardDraft(i)}>
                        <FiX className="h-4 w-4" /> Bỏ qua
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
