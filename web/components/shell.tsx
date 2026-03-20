"use client";

import type { ReactNode } from "react";
import { Heart } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-6">
      <div className="mb-5 flex items-center justify-between px-1">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Private for two</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brown-deep)]">Dailess</h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-lg shadow-rose-200/40">
          <Heart className="h-5 w-5 fill-[var(--pink-strong)] text-[var(--pink-strong)]" />
        </div>
      </div>
      {children}
    </main>
  );
}
