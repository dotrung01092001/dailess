import type { Message, Moment, SessionResponse, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Request failed");
  }

  return response.json();
}

export const api = {
  register(payload: { email: string; password: string; displayName: string }) {
    return request<SessionResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload: { email: string; password: string }) {
    return request<SessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me(token: string) {
    return request<{ user: User }>("/auth/me", {}, token);
  },
  partnerStatus(token: string) {
    return request<{ user: User }>("/partner/status", {}, token);
  },
  connectPartner(inviteCode: string, token: string) {
    return request<{ user: User; partner: User }>(
      "/partner/connect",
      {
        method: "POST",
        body: JSON.stringify({ inviteCode })
      },
      token
    );
  },
  disconnectPartner(token: string) {
    return request<{ user: User }>(
      "/partner/disconnect",
      {
        method: "DELETE"
      },
      token
    );
  },
  getMessages(token: string) {
    return request<{ messages: Message[] }>("/messages", {}, token);
  },
  createMessage(body: string, token: string) {
    return request<{ message: Message }>(
      "/messages",
      {
        method: "POST",
        body: JSON.stringify({ body })
      },
      token
    );
  },
  getMoments(token: string) {
    return request<{ moments: Moment[] }>("/moments", {}, token);
  },
  async createMoment(formData: FormData, token: string) {
    const response = await fetch(`${API_URL}/moments`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(data.message ?? "Failed to upload moment");
    }

    return response.json() as Promise<{ moment: Moment }>;
  },
  resolveImage(url: string) {
    if (/^https?:\/\//.test(url)) {
      return url;
    }

    return `${SOCKET_URL.replace(/\/$/, "")}${url}`;
  }
};
