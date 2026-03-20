import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getConversationKey } from "../lib/conversation.js";
import { createMessageRow, listMessages, requirePartneredUser } from "../lib/store.js";
import { messageSchema } from "../validation/message.js";

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get("/", async (req, res, next) => {
  try {
    const user = await requirePartneredUser(req.user!.userId);
    const conversationKey = getConversationKey(user.id, user.partner_id!);
    const messages = await listMessages(conversationKey);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

messageRouter.post("/", async (req, res, next) => {
  try {
    const user = await requirePartneredUser(req.user!.userId);
    const { body } = messageSchema.parse(req.body);
    const receiverId = user.partner_id!;
    const message = await createMessageRow({
      conversationKey: getConversationKey(user.id, receiverId),
      senderId: user.id,
      receiverId,
      body,
      status: "sent"
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});
