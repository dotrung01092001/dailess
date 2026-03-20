import { nanoid } from "nanoid";
import { env } from "../config/env.js";
import { supabase } from "./supabase.js";
import { AppError } from "../utils/errors.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  invite_code: string;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  inviteCode: string;
  partnerId: PublicUser | string | null;
}

interface MessageRow {
  id: string;
  conversation_key: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  status: "sent" | "delivered" | "seen";
  seen_at: string | null;
  created_at: string;
}

interface MomentRow {
  id: string;
  conversation_key: string;
  sender_id: string;
  receiver_id: string;
  image_path: string;
  filter: string;
  expires_at: string;
  created_at: string;
}

function normalizeUser(row: UserRow, partner?: PublicUser | null): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    inviteCode: row.invite_code,
    partnerId: partner ?? row.partner_id ?? null
  };
}

function normalizeMessage(row: MessageRow) {
  return {
    _id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    seenAt: row.seen_at
  };
}

async function signedMomentUrl(imagePath: string) {
  const { data, error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(imagePath, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    throw new AppError("Could not create moment URL.", 500);
  }

  return data.signedUrl;
}

async function normalizeMoment(row: MomentRow) {
  return {
    _id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    imageUrl: await signedMomentUrl(row.image_path),
    filter: row.filter,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

async function maybeSingle<T>(table: string, column: string, value: string): Promise<T | null> {
  const { data, error } = await supabase.from(table).select("*").eq(column, value).maybeSingle();
  if (error) {
    throw new AppError(error.message, 500);
  }
  return data as T | null;
}

export async function getUserRowById(userId: string) {
  return maybeSingle<UserRow>("users", "id", userId);
}

export async function getUserRowByEmail(email: string) {
  return maybeSingle<UserRow>("users", "email", email);
}

export async function getUserRowByInviteCode(inviteCode: string) {
  return maybeSingle<UserRow>("users", "invite_code", inviteCode);
}

export async function getHydratedUser(userId: string) {
  const user = await getUserRowById(userId);
  if (!user) return null;

  if (!user.partner_id) {
    return normalizeUser(user);
  }

  const partner = await getUserRowById(user.partner_id);
  return normalizeUser(user, partner ? normalizeUser(partner) : null);
}

export async function createUserRow(input: {
  email: string;
  passwordHash: string;
  displayName: string;
}) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: input.email,
      password_hash: input.passwordHash,
      display_name: input.displayName,
      invite_code: nanoid(10).toUpperCase()
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return normalizeUser(data as UserRow);
}

export async function linkPartners(userId: string, partnerId: string) {
  const { error: userError } = await supabase.from("users").update({ partner_id: partnerId }).eq("id", userId);
  if (userError) throw new AppError(userError.message, 500);

  const { error: partnerError } = await supabase.from("users").update({ partner_id: userId }).eq("id", partnerId);
  if (partnerError) throw new AppError(partnerError.message, 500);
}

export async function unlinkPartners(userId: string, partnerId: string | null) {
  const { error: userError } = await supabase.from("users").update({ partner_id: null }).eq("id", userId);
  if (userError) throw new AppError(userError.message, 500);

  if (partnerId) {
    const { error: partnerError } = await supabase.from("users").update({ partner_id: null }).eq("id", partnerId);
    if (partnerError) throw new AppError(partnerError.message, 500);
  }
}

export async function requirePartneredUser(userId: string) {
  const user = await getUserRowById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  if (!user.partner_id) {
    throw new AppError("Connect with your partner first.", 400);
  }
  return user;
}

export async function listMessages(conversationKey: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_key", conversationKey)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new AppError(error.message, 500);
  return (data as MessageRow[]).map(normalizeMessage);
}

export async function createMessageRow(input: {
  conversationKey: string;
  senderId: string;
  receiverId: string;
  body: string;
  status: "sent" | "delivered" | "seen";
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_key: input.conversationKey,
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      body: input.body,
      status: input.status
    })
    .select("*")
    .single();

  if (error) throw new AppError(error.message, 500);
  return normalizeMessage(data as MessageRow);
}

export async function markMessageSeen(messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .update({ status: "seen", seen_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return normalizeMessage(data as MessageRow);
}

export async function getMessageById(messageId: string) {
  const { data, error } = await supabase.from("messages").select("*").eq("id", messageId).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  return data ? normalizeMessage(data as MessageRow) : null;
}

export async function uploadMomentFile(file: Express.Multer.File, conversationKey: string) {
  const extension = file.mimetype === "image/png" ? "png" : "jpg";
  const path = `${conversationKey}/${Date.now()}-${nanoid(8)}.${extension}`;

  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return path;
}

export async function createMomentRow(input: {
  conversationKey: string;
  senderId: string;
  receiverId: string;
  imagePath: string;
  filter: string;
  expiresAt: string;
}) {
  const { data, error } = await supabase
    .from("moments")
    .insert({
      conversation_key: input.conversationKey,
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      image_path: input.imagePath,
      filter: input.filter,
      expires_at: input.expiresAt
    })
    .select("*")
    .single();

  if (error) throw new AppError(error.message, 500);
  return normalizeMoment(data as MomentRow);
}

export async function listActiveMoments(conversationKey: string) {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("conversation_key", conversationKey)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 500);
  return Promise.all((data as MomentRow[]).map(normalizeMoment));
}

export async function getMomentById(momentId: string) {
  const { data, error } = await supabase.from("moments").select("*").eq("id", momentId).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  return data ? normalizeMoment(data as MomentRow) : null;
}

export async function cleanupExpiredMoments() {
  const { data, error } = await supabase.from("moments").select("id,image_path").lt("expires_at", new Date().toISOString());
  if (error) throw new AppError(error.message, 500);

  if (!data?.length) {
    return;
  }

  const imagePaths = data.map((moment) => moment.image_path as string);
  const ids = data.map((moment) => moment.id as string);

  const { error: storageError } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(imagePaths);
  if (storageError) throw new AppError(storageError.message, 500);

  const { error: deleteError } = await supabase.from("moments").delete().in("id", ids);
  if (deleteError) throw new AppError(deleteError.message, 500);
}
