import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { getConversationKey } from "./conversation.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { Moment } from "../models/Moment.js";

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
    const user = await User.findById(socket.data.user.userId);

    if (!user) {
      socket.disconnect();
      return;
    }

    socket.join(user.id);

    if (user.partnerId) {
      socket.join(getConversationKey(user.id, user.partnerId.toString()));
    }

    socket.on("typing:start", async () => {
      const freshUser = await User.findById(socket.data.user.userId);
      if (!freshUser?.partnerId) return;
      io.to(freshUser.partnerId.toString()).emit("typing:start", {
        from: freshUser.id
      });
    });

    socket.on("typing:stop", async () => {
      const freshUser = await User.findById(socket.data.user.userId);
      if (!freshUser?.partnerId) return;
      io.to(freshUser.partnerId.toString()).emit("typing:stop", {
        from: freshUser.id
      });
    });

    socket.on("message:send", async ({ body }: { body: string }) => {
      const freshUser = await User.findById(socket.data.user.userId);
      if (!freshUser?.partnerId || !body?.trim()) return;

      const receiverId = freshUser.partnerId.toString();
      const conversationKey = getConversationKey(freshUser.id, receiverId);
      const message = await Message.create({
        conversationKey,
        senderId: freshUser._id,
        receiverId,
        body: body.trim(),
        status: "delivered"
      });

      io.to(conversationKey).emit("message:new", message);
    });

    socket.on("message:seen", async ({ messageId }: { messageId: string }) => {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { status: "seen", seenAt: new Date() },
        { new: true }
      );

      if (message) {
        io.to(getConversationKey(message.senderId.toString(), message.receiverId.toString())).emit(
          "message:updated",
          message
        );
      }
    });

    socket.on("moment:new", async ({ momentId }: { momentId: string }) => {
      const moment = await Moment.findById(momentId);
      if (!moment) return;
      io.to(moment.receiverId.toString()).emit("moment:new", moment);
    });
  });

  return io;
}

