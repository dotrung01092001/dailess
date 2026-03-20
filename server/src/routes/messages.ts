import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getConversationKey } from "../lib/conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { messageSchema } from "../validation/message.js";

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user?.partnerId) {
      throw new AppError("Connect with your partner first.", 400);
    }

    const conversationKey = getConversationKey(user.id, user.partnerId.toString());
    const messages = await Message.find({ conversationKey }).sort({ createdAt: 1 }).limit(200);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

messageRouter.post("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user?.partnerId) {
      throw new AppError("Connect with your partner first.", 400);
    }

    const { body } = messageSchema.parse(req.body);
    const receiverId = user.partnerId.toString();
    const message = await Message.create({
      conversationKey: getConversationKey(user.id, receiverId),
      senderId: user._id,
      receiverId,
      body,
      status: "sent"
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

