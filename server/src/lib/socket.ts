import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { getConversationKey } from "./conversation.js";
import { verifyToken } from "../utils/jwt.js";
import {
  createMessageRow,
  getMessageById,
  getMomentById,
  getUserRowById,
  markMessageSeen
} from "./store.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = await getUserRowById(socket.data.user.userId);

    if (!user) {
      socket.disconnect();
      return;
    }

    socket.join(user.id);

    if (user.partner_id) {
      socket.join(getConversationKey(user.id, user.partner_id));
    }

    socket.on("typing:start", async () => {
      const freshUser = await getUserRowById(socket.data.user.userId);
      if (!freshUser?.partner_id) return;
      io.to(freshUser.partner_id).emit("typing:start", {
        from: freshUser.id
      });
    });

    socket.on("typing:stop", async () => {
      const freshUser = await getUserRowById(socket.data.user.userId);
      if (!freshUser?.partner_id) return;
      io.to(freshUser.partner_id).emit("typing:stop", {
        from: freshUser.id
      });
    });

    socket.on("message:send", async ({ body }: { body: string }) => {
      const freshUser = await getUserRowById(socket.data.user.userId);
      if (!freshUser?.partner_id || !body?.trim()) return;

      const receiverId = freshUser.partner_id;
      const conversationKey = getConversationKey(freshUser.id, receiverId);
      const message = await createMessageRow({
        conversationKey,
        senderId: freshUser.id,
        receiverId,
        body: body.trim(),
        status: "delivered"
      });

      io.to(conversationKey).emit("message:new", message);
    });

    socket.on("message:seen", async ({ messageId }: { messageId: string }) => {
      await markMessageSeen(messageId);
      const message = await getMessageById(messageId);

      if (message) {
        io.to(getConversationKey(message.senderId.toString(), message.receiverId.toString())).emit(
          "message:updated",
          message
        );
      }
    });

    socket.on("moment:new", async ({ momentId }: { momentId: string }) => {
      const moment = await getMomentById(momentId);
      if (!moment) return;
      io.to(moment.receiverId.toString()).emit("moment:new", moment);
    });
  });

  return io;
}
