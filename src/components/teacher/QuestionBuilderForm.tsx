"use client";

import { QuestionCard } from "@/components/exam/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { uploadApi } from "@/lib/api/services";
import {
  previewQuestionFromForm,
  type BuilderQuestionType,
  type QuestionFormValue,
} from "@/lib/quiz-utils";
import { extractUploadKey, getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiUploadCloud } from "react-icons/fi";

const TYPE_OPTIONS: { value: BuilderQuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (nhiều lựa chọn)" },
  { value: "FILL_BLANK", label: "Điền đáp án (tự luận ngắn)" },
];

/** Upload file; nếu đang thay URL cũ thì xóa object R2 cũ (best-effort). */
function useUploadField(
  currentUrl: string | undefined,
  onUploaded: (url: string) => void,
) {
  return useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadApi.uploadSmart(file);
      const oldKey = currentUrl ? extractUploadKey(currentUrl) : null;
      if (oldKey) {
        try {
          await uploadApi.remove(oldKey);
        } catch {
          /* không chặn UX nếu xóa file cũ thất bại */
        }
      }
      return uploaded;
    },
    onSuccess: (data) => {
      onUploaded(data.url);
      toast.success("Đã tải file lên");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/**
 * Form soạn 1 câu hỏi theo loại (trắc nghiệm / điền đáp án) — luôn sinh ra content JSONB
 * chuẩn hoá qua `buildQuestionContent`, không có ô nhập JSON thô nào.
 */
export function QuestionBuilderForm({
  value,
  onChange,
  onSubmit,
  submitLabel = "Thêm câu hỏi",
  loading,
  onCancel,
}: {
  value: QuestionFormValue;
  onChange: (next: QuestionFormValue) => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  onCancel?: () => void;
}) {
  const [showPreview, setShowPreview] = useState(true);
  const audioUpload = useUploadField(value.audioUrl, (url) =>
    onChange({ ...value, audioUrl: url }),
  );
  const imageUpload = useUploadField(value.imageUrl, (url) =>
    onChange({ ...value, imageUrl: url }),
  );

  function setOption(idx: number, text: string) {
    const next = [...value.options];
    next[idx] = text;
    onChange({ ...value, options: next });
  }

  function addOption() {
    onChange({ ...value, options: [...value.options, ""] });
  }

  function removeOption(idx: number) {
    const next = value.options.filter((_, i) => i !== idx);
    const removed = value.options[idx];
    onChange({
      ...value,
      options: next,
      correct: value.correct === removed ? "" : value.correct,
    });
  }

  const canSubmit =
    value.question.trim().length > 0 &&
    value.correct.trim().length > 0 &&
    (value.type !== "MULTIPLE_CHOICE" ||
      value.options.filter((o) => o.trim()).length >= 2);

  return (
    <div className="space-y-4">
      <Select
        label="Loại câu hỏi"
        value={value.type}
        onChange={(e) => {
          const type = e.target.value as BuilderQuestionType;
          onChange({
            ...value,
            type,
            options:
              type === "MULTIPLE_CHOICE"
                ? value.options.length
                  ? value.options
                  : ["", "", "", ""]
                : [],
            correct: "",
          });
        }}
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>

      <Textarea
        label="Nội dung câu hỏi"
        placeholder="VD: The manager asked us ___ the report by Friday."
        value={value.question}
        onChange={(e) => onChange({ ...value, question: e.target.value })}
      />

      {value.type === "MULTIPLE_CHOICE" ? (
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">
            Lựa chọn — tick chọn đáp án đúng
          </span>
          {value.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={value.correct === opt && opt.trim() !== ""}
                onChange={() => onChange({ ...value, correct: opt })}
                disabled={!opt.trim()}
                className="h-4 w-4 accent-[var(--color-primary)]"
                aria-label={`Đáp án đúng là lựa chọn ${i + 1}`}
              />
              <Input
                className="flex-1"
                placeholder={`Lựa chọn ${i + 1}`}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
              />
              {value.options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface hover:text-accent"
                  aria-label="Xoá lựa chọn"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addOption}>
            <FiPlus className="h-4 w-4" /> Thêm lựa chọn
          </Button>
        </div>
      ) : (
        <Input
          label="Đáp án đúng"
          placeholder="Nhập đáp án chuẩn"
          value={value.correct}
          onChange={(e) => onChange({ ...value, correct: e.target.value })}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Part (tuỳ chọn, 1-7 TOEIC)"
          type="number"
          min={1}
          max={7}
          value={value.part ?? ""}
          onChange={(e) => onChange({ ...value, part: e.target.value })}
        />
        <Input
          label="Đoạn văn liên quan (tuỳ chọn)"
          placeholder="Dùng cho Part 6-7"
          value={value.passage ?? ""}
          onChange={(e) => onChange({ ...value, passage: e.target.value })}
        />
      </div>

      <Textarea
        label="Giải thích đáp án (tuỳ chọn)"
        value={value.explanation ?? ""}
        onChange={(e) => onChange({ ...value, explanation: e.target.value })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Audio (tuỳ chọn)</span>
          <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary">
            <FiUploadCloud className="h-4 w-4" />
            {value.audioUrl ? "Đã có audio — chọn để thay" : "Chọn file audio"}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) audioUpload.mutate(f);
                e.target.value = "";
              }}
            />
          </label>
          {audioUpload.isPending ? (
            <p className="text-xs text-muted">Đang tải lên...</p>
          ) : null}
          {value.audioUrl ? (
            <audio controls src={value.audioUrl} className="w-full" />
          ) : null}
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Hình ảnh (tuỳ chọn)</span>
          <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary">
            <FiUploadCloud className="h-4 w-4" />
            {value.imageUrl ? "Đã có ảnh — chọn để thay" : "Chọn hình ảnh"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) imageUpload.mutate(f);
                e.target.value = "";
              }}
            />
          </label>
          {imageUpload.isPending ? (
            <p className="text-xs text-muted">Đang tải lên...</p>
          ) : null}
          {value.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.imageUrl}
              alt=""
              className="max-h-28 rounded-[var(--radius-control)] border border-border object-contain"
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button loading={loading} disabled={!canSubmit} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            Huỷ
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowPreview((s) => !s)}
        >
          {showPreview ? "Ẩn xem trước" : "Xem trước"}
        </Button>
      </div>

      {showPreview && value.question.trim() ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
            Xem trước — học viên sẽ thấy như sau
          </p>
          <QuestionCard
            question={previewQuestionFromForm(value)}
            number={1}
            readOnly
            hideMedia={false}
          />
        </div>
      ) : null}
    </div>
  );
}
