"use client";

import { QuestionCard, type QuestionReviewInfo } from "@/components/exam/QuestionCard";
import { Button } from "@/components/ui/Button";
import { BarStat } from "@/components/ui/BarStat";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Tag } from "@/components/ui/Tag";
import { quizApi } from "@/lib/api/services";
import { getCachedSubmission } from "@/lib/submission-cache";
import {
  getCorrectAnswer,
  getQuestionExplanation,
  getToeicScoreBand,
  groupQuestionsByPart,
  splitListeningReadingCorrect,
} from "@/lib/toeic";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiAward,
  FiRefreshCw,
  FiThumbsUp,
} from "react-icons/fi";

type ReviewFilter = "all" | "wrong" | "flagged";

export default function QuizResultsPage() {
  const params = useParams<{ id: string; submissionId: string }>();
  const quizId = Number(params.id);
  const submissionId = Number(params.submissionId);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const cached = useMemo(
    () => (Number.isFinite(submissionId) ? getCachedSubmission(submissionId) : null),
    [submissionId],
  );

  const analyticsQ = useQuery({
    queryKey: ["quizzes", "submissions", submissionId, "analytics"],
    queryFn: () => quizApi.analytics(submissionId),
    enabled: Number.isFinite(submissionId),
  });

  const sectionSplit = useMemo(() => {
    if (!cached) return null;
    return splitListeningReadingCorrect(cached.questions, cached.submission.results);
  }, [cached]);

  const scaledListening =
    sectionSplit && sectionSplit.listeningTotal > 0
      ? Math.round((sectionSplit.listeningCorrect / sectionSplit.listeningTotal) * 100)
      : 0;
  const scaledReading =
    sectionSplit && sectionSplit.readingTotal > 0
      ? Math.round((sectionSplit.readingCorrect / sectionSplit.readingTotal) * 100)
      : 0;

  const scoreConversionQ = useQuery({
    queryKey: ["quizzes", "score-conversion", submissionId, scaledListening, scaledReading],
    queryFn: () => quizApi.scoreConversion(scaledListening, scaledReading),
    enabled: Boolean(
      sectionSplit && (sectionSplit.listeningTotal > 0 || sectionSplit.readingTotal > 0),
    ),
  });

  const partGroups = useMemo(
    () => (cached ? groupQuestionsByPart(cached.questions) : []),
    [cached],
  );

  const partBreakdown = useMemo(() => {
    if (!cached) return [];
    const resultByQuestionId = new Map(
      cached.submission.results.map((r) => [r.questionId, r.isCorrect]),
    );
    return partGroups.map((group) => {
      const total = group.questions.length;
      const correct = group.questions.filter((qq) => resultByQuestionId.get(qq.id)).length;
      return { label: group.meta?.label ?? group.label, correct, total };
    });
  }, [cached, partGroups]);

  const flaggedSet = useMemo(
    () => new Set(cached?.flaggedQuestionIds ?? []),
    [cached],
  );

  const reviewByQuestionId = useMemo(() => {
    const map = new Map<number, QuestionReviewInfo>();
    if (!cached) return map;
    const resultByQuestionId = new Map(
      cached.submission.results.map((r) => [r.questionId, r]),
    );
    for (const question of cached.questions) {
      const result = resultByQuestionId.get(question.id);
      map.set(question.id, {
        isCorrect: Boolean(result?.isCorrect),
        userAnswer: result?.answer ?? "",
        correctAnswer: getCorrectAnswer(question),
        explanation: getQuestionExplanation(question),
      });
    }
    return map;
  }, [cached]);

  if (analyticsQ.isLoading) return <PageLoading label="Đang tải kết quả..." />;
  if (analyticsQ.isError) return <ErrorState message={getErrorMessage(analyticsQ.error)} />;

  const analytics = analyticsQ.data;
  const band = analytics ? getToeicScoreBand(scoreConversionQ.data?.totalScore ?? 0) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/quizzes/${quizId}`}
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <FiArrowLeft /> Quay lại đề
        </Link>
        <PageHeader
          title="Kết quả bài thi"
          description={analytics?.quizTitle ?? cached?.quizTitle ?? undefined}
          actions={
            <Link href={`/quizzes/${quizId}/exam`}>
              <Button variant="outline">
                <FiRefreshCw className="h-4 w-4" /> Làm lại
              </Button>
            </Link>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-2 sm:col-span-1">
          {scoreConversionQ.data ? (
            <>
              <ScoreGauge
                value={scoreConversionQ.data.totalScore}
                colorVar={band?.colorVar}
                label="/ 990"
              />
              <Tag variant="primary">{band?.label}</Tag>
              <p className="text-center text-xs text-muted">
                Điểm TOEIC ước tính (quy đổi theo tỉ lệ đúng, giả định đề đủ 100 câu / phần)
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground">
                {analytics?.overallAccuracyPercent ?? 0}%
              </p>
              <p className="text-sm text-muted">Độ chính xác tổng quát</p>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Tổng quan</CardTitle>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Câu đúng</p>
              <p className="text-lg font-bold text-success">
                {analytics?.totalCorrect}/{analytics?.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-muted">Độ chính xác</p>
              <p className="text-lg font-bold text-foreground">
                {analytics?.overallAccuracyPercent}%
              </p>
            </div>
            {sectionSplit && sectionSplit.listeningTotal > 0 ? (
              <div>
                <p className="text-muted">Listening</p>
                <p className="text-lg font-bold text-primary">
                  {sectionSplit.listeningCorrect}/{sectionSplit.listeningTotal}
                </p>
              </div>
            ) : null}
            {sectionSplit && sectionSplit.readingTotal > 0 ? (
              <div>
                <p className="text-muted">Reading</p>
                <p className="text-lg font-bold text-primary">
                  {sectionSplit.readingCorrect}/{sectionSplit.readingTotal}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiAward className="h-4 w-4 text-secondary" /> Nhận xét
          </CardTitle>
          <CardDescription>{analytics?.recommendation}</CardDescription>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiThumbsUp className="h-4 w-4 text-success" /> Điểm mạnh
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {(analytics?.strengths ?? []).map((s) => (
              <Tag key={s} variant="success">
                {s}
              </Tag>
            ))}
          </div>
        </Card>
        <Card className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiAlertTriangle className="h-4 w-4 text-accent" /> Cần cải thiện
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {(analytics?.weaknesses ?? []).map((w) => (
              <Tag key={w} variant="danger">
                {w}
              </Tag>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <CardTitle className="text-base">Phân tích theo Part</CardTitle>
        {partBreakdown.length > 0 ? (
          <div className="space-y-3">
            {partBreakdown.map((row) => (
              <BarStat key={row.label} label={row.label} correct={row.correct} total={row.total} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Không có dữ liệu chi tiết theo Part (đề không gắn field &quot;part&quot;).
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle className="text-base">Phân tích theo chuyên đề (BE)</CardTitle>
        <div className="space-y-3">
          {(analytics?.categoriesBreakdown ?? []).map((row) => (
            <BarStat
              key={row.category}
              label={row.category}
              correct={row.correct}
              total={row.total}
              accuracyPercent={row.accuracyPercent}
            />
          ))}
        </div>
      </Card>

      {cached ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Xem lại từng câu</CardTitle>
            <div className="flex gap-2">
              {(
                [
                  ["all", "Tất cả"],
                  ["wrong", "Chỉ câu sai"],
                  ["flagged", "Đã đánh dấu"],
                ] as [ReviewFilter, string][]
              ).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filter === key ? "primary" : "outline"}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {partGroups.map((group) =>
              group.questions
                .filter((question) => {
                  const review = reviewByQuestionId.get(question.id);
                  if (filter === "wrong") return review && !review.isCorrect;
                  if (filter === "flagged") return flaggedSet.has(question.id);
                  return true;
                })
                .map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    number={cached.questions.findIndex((qq) => qq.id === question.id) + 1}
                    review={reviewByQuestionId.get(question.id)}
                    flagged={flaggedSet.has(question.id)}
                    readOnly
                  />
                )),
            )}
          </div>
        </Card>
      ) : (
        <Card className="border-warning/40 bg-warning/5">
          <p className="text-sm text-foreground">
            Không thể tải chi tiết từng câu sau khi tải lại trang hoặc chia sẻ liên kết — hệ thống
            hiện chỉ lưu bảng phân tích tổng quan phía trên. Hãy làm lại bài để xem chi tiết đáp
            án từng câu.
          </p>
        </Card>
      )}
    </div>
  );
}
