import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getConversationKey } from "../lib/conversation.js";
import { createMomentRow, listActiveMoments, requirePartneredUser, uploadMomentFile } from "../lib/store.js";
import { upload } from "../services/upload.js";
import { AppError } from "../utils/errors.js";

export const momentRouter = Router();

momentRouter.use(requireAuth);

momentRouter.get("/", async (req, res, next) => {
  try {
    const user = await requirePartneredUser(req.user!.userId);
    const conversationKey = getConversationKey(user.id, user.partner_id!);
    const moments = await listActiveMoments(conversationKey);
    res.json({ moments });
  } catch (error) {
    next(error);
  }
});

momentRouter.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const user = await requirePartneredUser(req.user!.userId);

    if (!req.file) {
      throw new AppError("A captured photo is required.", 400);
    }

    const receiverId = user.partner_id!;
    const conversationKey = getConversationKey(user.id, receiverId);
    const imagePath = await uploadMomentFile(req.file, conversationKey);
    const moment = await createMomentRow({
      conversationKey,
      senderId: user.id,
      receiverId,
      imagePath,
      filter: typeof req.body.filter === "string" ? req.body.filter : "soft",
      caption: typeof req.body.caption === "string" ? req.body.caption.trim().slice(0, 140) : null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    res.status(201).json({ moment });
  } catch (error) {
    next(error);
  }
});
