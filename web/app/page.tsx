"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Heart, LoaderCircle, LogOut, MessageCircleHeart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { AuthCard } from "../components/auth-card";
import { CameraSheet } from "../components/camera-sheet";
import { ChatPanel } from "../components/chat-panel";
import { MomentsFeed } from "../components/moments-feed";
import { PartnerCard } from "../components/partner-card";
import { AppShell } from "../components/shell";
import { api, SOCKET_URL } from "../lib/api";
import type { Message, Moment, User } from "../lib/types";

type AuthMode = "login" | "register";
type Tab = "moments" | "chat";

function usePersistentToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("dailess-token");
    if (saved) setToken(saved);
    setReady(true);
  }, []);

  const save = (value: string | null) => {
    setToken(value);
    if (value) {
      window.localStorage.setItem("dailess-token", value);
    } else {
      window.localStorage.removeItem("dailess-token");
    }
  };

  return { token, save, ready };
}

function AppLoadingScreen() {
  return (
    <AppShell>
      <section className="glass-panel flex min-h-[70vh] flex-col items-center justify-center rounded-[36px] border border-white/70 px-8 text-center">
        <div className="romantic-gradient mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg shadow-rose-200/40">
          <Heart className="h-8 w-8 fill-white text-white" />
        </div>
        <LoaderCircle className="h-7 w-7 animate-spin text-[var(--ocean-deep)]" />
        <h2 className="mt-5 text-2xl font-semibold text-[var(--brown-deep)]">Opening your shared space</h2>
        <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--muted)]">
          Holding your memories, your messages, and the tiny pieces of today for just the two of you.
        </p>
      </section>
    </AppShell>
  );
}

export default function HomePage() {
  const { token, save, ready } = usePersistentToken();
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<Tab>("moments");
  const [authLoading, setAuthLoading] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [momentUploading, setMomentUploading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [error, setError] = useState("");

  const partner = useMemo(() => {
    if (!user?.partnerId || typeof user.partnerId === "string") return null;
    return user.partnerId;
  }, [user]);

  const hydrateSession = async (sessionToken: string) => {
    setScreenLoading(true);

    try {
      const session = await api.me(sessionToken);
      setUser(session.user);

      if (session.user.partnerId) {
        const [{ messages }, { moments }] = await Promise.all([
          api.getMessages(sessionToken).catch(() => ({ messages: [] })),
          api.getMoments(sessionToken).catch(() => ({ moments: [] }))
        ]);
        setMessages(messages);
        setMoments(moments);
      } else {
        setMessages([]);
        setMoments([]);
      }

      setError("");
    } catch (sessionError) {
      save(null);
      setUser(null);
      setMessages([]);
      setMoments([]);
      setError(sessionError instanceof Error ? sessionError.message : "Unable to restore your session.");
    } finally {
      setScreenLoading(false);
    }
  };

  useEffect(() => {
    if (ready && token) {
      void hydrateSession(token);
    }
  }, [ready, token]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("message:new", (message: Message) => {
      setMessages((state) => {
        if (state.some((item) => item._id === message._id)) return state;
        return [...state, message];
      });

      if (message.receiverId === user.id) {
        socket.emit("message:seen", { messageId: message._id });
      }
    });

    socket.on("message:updated", (message: Message) => {
      setMessages((state) => state.map((item) => (item._id === message._id ? message : item)));
    });

    socket.on("typing:start", () => setPartnerTyping(true));
    socket.on("typing:stop", () => setPartnerTyping(false));
    socket.on("moment:new", (moment: Moment) => {
      setMoments((state) => [moment, ...state.filter((item) => item._id !== moment._id)]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  const submitAuth = async (payload: { email: string; password: string; displayName?: string }) => {
    setAuthLoading(true);
    setError("");

    try {
      const response =
        authMode === "login"
          ? await api.login({ email: payload.email, password: payload.password })
          : await api.register({
              email: payload.email,
              password: payload.password,
              displayName: payload.displayName ?? ""
            });
      save(response.token);
      setUser(response.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setAuthLoading(false);
    }
  };

  const connectPartner = async (inviteCode: string) => {
    if (!token) return;
    setPartnerLoading(true);
    setError("");

    try {
      await api.connectPartner(inviteCode, token);
      await hydrateSession(token);
    } catch (partnerError) {
      setError(partnerError instanceof Error ? partnerError.message : "Could not connect accounts.");
    } finally {
      setPartnerLoading(false);
    }
  };

  const disconnectPartner = async () => {
    if (!token) return;
    setPartnerLoading(true);
    setError("");

    try {
      await api.disconnectPartner(token);
      setUser((state) => (state ? { ...state, partnerId: null } : state));
      setMessages([]);
      setMoments([]);
      setTab("moments");
      setPartnerTyping(false);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Could not remove the connection.");
    } finally {
      setPartnerLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!token || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    socketRef.current?.emit("typing:stop");

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("message:send", { body });
      } else {
        const { message } = await api.createMessage(body, token);
        setMessages((state) => [...state, message]);
      }
    } catch (messageError) {
      setDraft(body);
      setError(messageError instanceof Error ? messageError.message : "Message could not be sent.");
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!socketRef.current) return;
    socketRef.current.emit("typing:start");
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("typing:stop");
    }, 900);
  };

  const shareMoment = async (file: File, filter: string, caption: string) => {
    if (!token) return;
    setMomentUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("filter", filter);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }
      const { moment } = await api.createMoment(formData, token);
      setMoments((state) => [moment, ...state.filter((item) => item._id !== moment._id)]);
      socketRef.current?.emit("moment:new", { momentId: moment._id });
      setCameraOpen(false);
      setTab("moments");
    } catch (momentError) {
      setError(momentError instanceof Error ? momentError.message : "Moment could not be sent.");
    } finally {
      setMomentUploading(false);
    }
  };

  if (!ready || (token && (screenLoading || !user))) {
    return <AppLoadingScreen />;
  }

  if (!token || !user) {
    return (
      <AppShell>
        <section className="mb-4 rounded-[30px] p-5 text-[var(--brown-deep)]">
          <p className="text-sm leading-7 text-[var(--muted)]">
            A quiet place for messages, fleeting photos, and the small pieces of a day that matter most.
          </p>
        </section>
        <AuthCard mode={authMode} onModeChange={setAuthMode} onSubmit={submitAuth} loading={authLoading} error={error} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mb-4 flex items-center justify-between rounded-[28px] bg-white/70 px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Signed in as</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--brown-deep)]">{user.displayName}</h2>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80"
          onClick={() => {
            save(null);
            setUser(null);
            setMessages([]);
            setMoments([]);
          }}
        >
          <LogOut className="h-5 w-5 text-[var(--brown)]" />
        </button>
      </section>

      <div className="space-y-4">
        <PartnerCard user={user} onConnect={connectPartner} onDisconnect={disconnectPartner} loading={partnerLoading} />

        {partner ? (
          <>
            <section className="grid grid-cols-3 gap-2 rounded-[28px] bg-white/65 p-2">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-[22px] px-3 py-3 text-sm ${
                  tab === "moments" ? "bg-[var(--brown-deep)] text-white" : "text-[var(--brown)]"
                }`}
                onClick={() => setTab("moments")}
              >
                <Heart className="h-4 w-4" />
                Moments
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-[22px] px-3 py-3 text-sm ${
                  tab === "chat" ? "bg-[var(--brown-deep)] text-white" : "text-[var(--brown)]"
                }`}
                onClick={() => setTab("chat")}
              >
                <MessageCircleHeart className="h-4 w-4" />
                Chat
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-[22px] bg-[var(--pink)]/45 px-3 py-3 text-sm text-[var(--brown-deep)]"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Camera
              </button>
            </section>

            {error ? <p className="px-1 text-sm text-rose-500">{error}</p> : null}

            {tab === "moments" ? (
              <MomentsFeed moments={moments} currentUser={user} />
            ) : (
              <ChatPanel
                currentUser={user}
                partnerName={partner.displayName}
                messages={messages}
                draft={draft}
                typing={Boolean(draft.trim())}
                partnerTyping={partnerTyping}
                onDraftChange={handleDraftChange}
                onSend={sendMessage}
              />
            )}
          </>
        ) : error ? (
          <p className="px-1 text-sm text-rose-500">{error}</p>
        ) : null}
      </div>

      <CameraSheet open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={shareMoment} loading={momentUploading} />
    </AppShell>
  );
}
