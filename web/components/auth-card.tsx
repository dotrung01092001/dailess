"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HeartHandshake, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

type Props = {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  onSubmit: (payload: { email: string; password: string; displayName?: string }) => Promise<void>;
  loading: boolean;
  error: string;
};

export function AuthCard({ mode, onModeChange, onSubmit, loading, error }: Props) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: ""
  });

  return (
    <section className="glass-panel relative overflow-hidden rounded-[32px] border border-white/70 px-5 py-6">
      <div className="romantic-gradient absolute inset-x-6 top-0 h-24 rounded-b-[30px] opacity-60 blur-2xl" />
      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85">
            <HeartHandshake className="h-6 w-6 text-[var(--pink-strong)]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--brown-deep)]">
              {mode === "login" ? "Come back close" : "Start your shared space"}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Soft, private, and made for two people who only need each other.
            </p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(form);
          }}
        >
          <AnimatePresence initial={false}>
            {mode === "register" ? (
              <motion.label
                key="displayName"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="block"
              >
                <span className="mb-2 block text-sm text-[var(--muted)]">Display name</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
                  <HeartHandshake className="h-4 w-4 text-[var(--pink-strong)]" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="Honey"
                    value={form.displayName}
                    onChange={(event) => setForm((state) => ({ ...state, displayName: event.target.value }))}
                    required={mode === "register"}
                  />
                </div>
              </motion.label>
            ) : null}
          </AnimatePresence>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
              <Mail className="h-4 w-4 text-[var(--ocean-deep)]" />
              <input
                className="w-full bg-transparent outline-none"
                type="email"
                placeholder="you@dailess.com"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3">
              <LockKeyhole className="h-4 w-4 text-[var(--brown)]" />
              <input
                className="w-full bg-transparent outline-none"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
                required
              />
            </div>
          </label>

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <button
            className="w-full rounded-2xl bg-[var(--brown-deep)] px-4 py-3 text-sm font-medium text-white transition hover:translate-y-[-1px] disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Holding your space..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-[var(--brown)]"
          onClick={() => onModeChange(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need a new shared home? Create one." : "Already have an account? Log in."}
        </button>
      </div>
    </section>
  );
}

