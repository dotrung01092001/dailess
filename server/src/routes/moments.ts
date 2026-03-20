import { Router } from "express";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { getConversationKey } from "../lib/conversation.js";
import { Moment } from "../models/Moment.js";
import { User } from "../models/User.js";
import { upload } from "../services/upload.js";
import { AppError } from "../utils/errors.js";

export const momentRouter = Router();

momentRouter.use(requireAuth);

momentRouter.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user?.partnerId) {
      throw new AppError("Connect with your partner first.", 400);
    }

    const conversationKey = getConversationKey(user.id, user.partnerId.toString());
    const moments = await Moment.find({
      conversationKey,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json({ moments });
  } catch (error) {
    next(error);
  }
});

momentRouter.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user?.partnerId) {
      throw new AppError("Connect with your partner first.", 400);
    }

    if (!req.file) {
      throw new AppError("A captured photo is required.", 400);
    }

    const receiverId = user.partnerId.toString();
    const imageUrl = `/uploads/${path.basename(req.file.filename)}`;
    const moment = await Moment.create({
      conversationKey: getConversationKey(user.id, receiverId),
      senderId: user._id,
      receiverId,
      imageUrl,
      filter: typeof req.body.filter === "string" ? req.body.filter : "soft",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ moment });
  } catch (error) {
    next(error);
  }
});

