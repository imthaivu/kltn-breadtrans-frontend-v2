"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { FiCpu, FiUser } from "react-icons/fi";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: number;
};

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** Danh sách hội thoại dạng bong bóng chat — tự cuộn xuống tin mới nhất mỗi khi có tin nhắn. */
export function ChatThread({
  messages,
  pending,
}: {
  messages: ChatMessage[];
  pending?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  return (
    <div className="flex h-full min-h-[50vh] flex-col gap-4 overflow-y-auto p-1">
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-2.5",
            m.role === "user" && "flex-row-reverse self-end",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              m.role === "user" ? "bg-primary text-white" : "bg-secondary/20 text-secondary-foreground",
            )}
          >
            {m.role === "user" ? <FiUser className="h-4 w-4" /> : <FiCpu className="h-4 w-4" />}
          </div>
          <div
            className={cn(
              "max-w-[80%] space-y-1 rounded-[var(--radius-card)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
              m.role === "user"
                ? "bg-primary text-white"
                : "border border-border bg-white text-foreground",
            )}
          >
            {m.content}
            <div
              className={cn(
                "text-[10px] opacity-70",
                m.role === "user" ? "text-white/80" : "text-muted",
              )}
            >
              {formatTime(m.at)}
            </div>
          </div>
        </div>
      ))}
      {pending ? (
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground">
            <FiCpu className="h-4 w-4" />
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-white px-4 py-2.5 shadow-sm">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
            </span>
          </div>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}
