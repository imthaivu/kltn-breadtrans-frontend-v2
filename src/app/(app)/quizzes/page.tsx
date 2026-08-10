"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { quizApi } from "@/lib/api/services";
import type { QuizSummary } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function QuizzesPage() {
  const [listenL, setListenL] = useState(0);
  const [readR, setReadR] = useState(0);
  const [converted, setConverted] = useState<unknown>(null);

  const q = useQuery({
    queryKey: ["quizzes", "listening-practice"],
    queryFn: () => quizApi.listeningPractice(),
  });

  const convert = useMutation({
    mutationFn: () => quizApi.scoreConversion(listenL, readR),
    onSuccess: (data) => {
      setConverted(data);
      toast.success("Đã quy đổi điểm TOEIC");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const quizzes: QuizSummary[] = Array.isArray(q.data) ? q.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quizzes / Listening</h1>
        <p className="text-sm text-muted">
          Luyện nghe LISTENING_PRACTICE và quy đổi điểm TOEIC.
        </p>
      </div>

      {q.isLoading ? (
        <PageLoading />
      ) : q.isError ? (
        <ErrorState message={getErrorMessage(q.error)} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          title="Chưa có listening practice"
          description="Dùng AI Generate Dictation hoặc import ETS PDF."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}`}>
              <Card className="h-full transition hover:border-primary">
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.type || "LISTENING_PRACTICE"}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="space-y-3">
        <CardTitle className="text-base">Quy đổi điểm TOEIC</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Listening đúng"
            type="number"
            min={0}
            max={100}
            value={listenL}
            onChange={(e) => setListenL(Number(e.target.value))}
          />
          <Input
            label="Reading đúng"
            type="number"
            min={0}
            max={100}
            value={readR}
            onChange={(e) => setReadR(Number(e.target.value))}
          />
        </div>
        <Button loading={convert.isPending} onClick={() => convert.mutate()}>
          Quy đổi
        </Button>
        {converted ? (
          <pre className="rounded-md bg-surface p-3 text-sm">
            {JSON.stringify(converted, null, 2)}
          </pre>
        ) : null}
      </Card>
    </div>
  );
}
