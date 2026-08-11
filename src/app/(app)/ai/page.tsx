"use client";

import { ChatThread, type ChatMessage } from "@/components/ai/ChatThread";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { aiApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiCpu, FiSend } from "react-icons/fi";

const STARTER_PROMPTS = [
  "Giải thích sự khác nhau giữa thì hiện tại hoàn thành và quá khứ đơn",
  "Cho ví dụ câu dùng cấu trúc \"used to\"",
  "Gợi ý cách học từ vựng TOEIC Part 5 hiệu quả",
  "Sửa lỗi câu: \"I have visited Paris last year\"",
];

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");

  const chat = useMutation({
    mutationFn: (text: string) => aiApi.chat(text),
    onSuccess: (data) => {
      setMessages((list) => [
        ...list,
        { role: "assistant", content: data?.reply ?? "(Không có phản hồi)", at: Date.now() },
      ]);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setMessages((list) => [
        ...list,
        { role: "assistant", content: "Xin lỗi, mình gặp lỗi khi trả lời. Bạn thử lại nhé.", at: Date.now() },
      ]);
    },
  });

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    setMessages((list) => [...list, { role: "user", content: trimmed, at: Date.now() }]);
    setPrompt("");
    chat.mutate(trimmed);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <PageHeader
        title="Trợ lý AI"
        description="Hỏi đáp ngữ pháp, từ vựng, cách học — trò chuyện trực tiếp với gia sư AI."
      />

      <Card className="flex flex-1 flex-col overflow-hidden p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiCpu className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Hỏi mình bất cứ điều gì</h3>
              <p className="text-sm text-muted">Ngữ pháp, từ vựng, cách học tiếng Anh...</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ChatThread messages={messages} pending={chat.isPending} />
        )}

        <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
          <Textarea
            className="min-h-12 flex-1 resize-none"
            placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(prompt);
              }
            }}
          />
          <Button
            loading={chat.isPending}
            disabled={!prompt.trim()}
            onClick={() => send(prompt)}
            aria-label="Gửi"
          >
            <FiSend className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
