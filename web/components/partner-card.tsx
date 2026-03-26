"use client";

import { Copy, HeartOff, Link2, Sparkles } from "lucide-react";
import { useState } from "react";
import type { User } from "../lib/types";

type Props = {
  user: User;
  onConnect: (code: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  loading: boolean;
};

export function PartnerCard({ user, onConnect, onDisconnect, loading }: Props) {
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const partner = typeof user.partnerId === "object" ? user.partnerId : null;

  if (partner) {
    return (
      <section className="glass-panel rounded-[32px] border border-white/70 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Paired</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--brown-deep)]">{partner.displayName}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Your invite link is closed now. This space belongs to just the two of you.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 disabled:opacity-60"
          onClick={() => void onDisconnect()}
          disabled={loading}
        >
          <HeartOff className="h-3.5 w-3.5" />
          {loading ? "Disconnecting..." : "Remove connection"}
        </button>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-[32px] border border-white/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Connect with one partner</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--brown-deep)]">Lock your circle</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
          <Sparkles className="h-5 w-5 text-[var(--pink-strong)]" />
        </div>
      </div>

      <div className="mt-5 rounded-[28px] bg-white/80 p-4">
        <p className="text-sm text-[var(--muted)]">Your invite code</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-2xl font-semibold tracking-[0.2em] text-[var(--brown-deep)]">{user.inviteCode}</span>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--pink)]/40"
            onClick={async () => {
              await navigator.clipboard.writeText(user.inviteCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            <Copy className="h-4 w-4 text-[var(--brown-deep)]" />
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">{copied ? "Copied with love." : "Share this one time code with your partner."}</p>
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await onConnect(inviteCode);
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--muted)]">Enter your partner&apos;s code</span>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
            <Link2 className="h-4 w-4 text-[var(--ocean-deep)]" />
            <input
              className="w-full bg-transparent uppercase outline-none"
              placeholder="AB12CD34"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              required
            />
          </div>
        </label>

        <button
          className="w-full rounded-2xl bg-[var(--ocean-deep)] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect only to this partner"}
        </button>
      </form>
    </section>
  );
}
