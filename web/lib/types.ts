export interface User {
  id: string;
  email: string;
  displayName: string;
  inviteCode: string;
  partnerId?: User | string | null;
}

export interface SessionResponse {
  token: string;
  user: User;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  body: string;
  status: "sent" | "delivered" | "seen";
  createdAt: string;
  seenAt?: string | null;
}

export interface Moment {
  _id: string;
  senderId: string;
  receiverId: string;
  imageUrl: string;
  filter: string;
  createdAt: string;
  expiresAt: string;
}

