"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CornerDownRight, SendHorizonal } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Message, User } from "../lib/types";

type Props = {
  currentUser: User;
  partnerName: string;
  messages: Message[];
  draft: string;
  typing: boolean;
  partnerTyping: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => Promise<void>;
};

function formatStatus(message: Message, currentUser: User) {
  if (message.senderId !== currentUser.id) return "";
  if (message.status === "seen") return "Seen";
  if (message.status === "delivered") return "Delivered";
  return "Sent";
}

export function ChatPanel({
  currentUser,
  partnerName,
  messages,
  draft,
  typing,
  partnerTyping,
  onDraftChange,
  onSend
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, partnerTyping]);

  return (
    <section className="glass-panel flex min-h-[28rem] flex-col overflow-hidden rounded-[32px] border border-white/70">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Private chat</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--brown-deep)]">{partnerName}</h2>
      </div>

      <div ref={containerRef} className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isMine = message.senderId === currentUser.id;

            return (
              <motion.div
                key={message._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[24px] px-4 py-3 shadow-sm ${
                    isMine ? "bg-[var(--ocean)] text-white" : "bg-white/85 text-[var(--brown-deep)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p className={`mt-2 text-[11px] ${isMine ? "text-white/85" : "text-[var(--muted)]"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}{" "}
                    {formatStatus(message, currentUser)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {partnerTyping ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm text-[var(--muted)]"
          >
            <CornerDownRight className="h-4 w-4" />
            {partnerName} is typing...
          </motion.div>
        ) : null}
      </div>

      <form
        className="border-t border-[var(--border)] p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSend();
        }}
      >
        <div className="flex items-end gap-3 rounded-[26px] bg-white/90 p-2">
          <textarea
            rows={1}
            className="max-h-24 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 outline-none"
            placeholder={typing ? "Send a soft thought..." : "Write something sweet..."}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
          />
          <button
            type="submit"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brown-deep)] text-white"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

