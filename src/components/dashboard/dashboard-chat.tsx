"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { answerDashboardQuestion } from "@/app/actions/chat.actions";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
}

const suggestions = ["Total expenses this month", "How much did I spend today?", "What is my balance?"];

export function DashboardChat() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      content: "Hi! Ask me about your expenses, income, or balance.",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const submitQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: trimmed },
    ]);

    startTransition(async () => {
      let result;
      try {
        result = await answerDashboardQuestion(trimmed);
      } catch {
        result = {
          data: null,
          error: "The assistant could not process that question. Please try again.",
        };
      }
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: result.data || result.error || "I couldn't answer that right now.",
        },
      ]);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(input);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-10 right-10 z-40">
      {open && (
        <section
          aria-label="SpendWise AI"
          className="mb-3 flex h-[min(650px,calc(100vh-120px))] w-[min(460px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
        >
          <header className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--gradient-blue)] text-white">
                <Sparkles className="h-5 w-5 text-black dark:text-white" />
              </span>
              <div>
                <h2 className="text-[16px] font-bold">SpendWise AI</h2>
                <p className="text-[12px] text-[var(--text-secondary)]">Your numbers, on demand</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-[var(--text-secondary)] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[96%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-[var(--apple-blue)] text-white"
                      : "rounded-bl-md bg-[rgba(120,120,128,0.12)] text-[var(--text-primary)]"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isPending && (
              <p className="w-fit rounded-2xl rounded-bl-md bg-[rgba(120,120,128,0.12)] px-3.5 py-2.5 text-[13px] text-[var(--text-secondary)]">
                Checking your data…
              </p>
            )}
          </div>

          <div className="border-t border-[var(--separator)] p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitQuestion(suggestion)}
                  className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--apple-blue)] hover:text-[var(--apple-blue)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your finances…"
                aria-label="Ask about your finances"
                className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--apple-blue)]"
              />
              <button
                type="submit"
                aria-label="Send question"
                disabled={!input.trim() || isPending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--apple-blue)] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={open ? "Close SpendWise assistant" : "Open SpendWise assistant"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--apple-blue)] text-white shadow-[0_8px_24px_rgba(0,122,255,0.35)] transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>,
    document.body
  );
}
