"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Hourglass } from "lucide-react";
import Image from "next/image";
import { api } from "../lib/api";
import { getCameraFilterStyle } from "../lib/camera-filters";
import type { Moment, User } from "../lib/types";

type Props = {
  moments: Moment[];
  currentUser: User;
};

export function MomentsFeed({ moments, currentUser }: Props) {
  return (
    <section className="glass-panel rounded-[32px] border border-white/70 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Daily moments</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--brown-deep)]">Today between you two</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
          <Hourglass className="h-5 w-5 text-[var(--ocean-deep)]" />
        </div>
      </div>

      <div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
        <AnimatePresence initial={false}>
          {moments.length ? (
            moments.map((moment) => (
              <motion.article
                key={moment._id}
                layout
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                className="story-gradient relative min-h-[18rem] min-w-[15rem] snap-start overflow-hidden rounded-[28px] p-3 text-white"
              >
                <div className="absolute inset-3 overflow-hidden rounded-[22px]">
                  <Image
                    src={api.resolveImage(moment.imageUrl)}
                    alt="Daily moment"
                    fill
                    unoptimized
                    className="object-cover"
                    style={{ filter: getCameraFilterStyle(moment.filter) }}
                  />
                </div>
                <div className="relative flex h-full flex-col justify-between rounded-[22px] bg-black/10 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>{moment.senderId === currentUser.id ? "You shared this" : "From your love"}</span>
                    <span>{new Date(moment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="rounded-2xl bg-white/16 p-3 backdrop-blur-sm">
                    <p className="text-sm leading-6">
                      {moment.caption?.trim() ? moment.caption : "Fades in 24 hours. A tiny memory, still warm."}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[18rem] min-w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/60 bg-white/45 px-8 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                <Camera className="h-6 w-6 text-[var(--pink-strong)]" />
              </div>
              <p className="mt-4 text-base font-medium text-[var(--brown-deep)]">No moments yet today</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Take a photo inside Dailess and it will appear here for the next 24 hours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
