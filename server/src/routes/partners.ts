import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getHydratedUser } from "../lib/store.js";
import { connectPartners, disconnectPartner } from "../services/partner-service.js";
import { inviteSchema } from "../validation/partner.js";

export const partnerRouter = Router();

partnerRouter.use(requireAuth);

partnerRouter.get("/status", async (req, res, next) => {
  try {
    const user = await getHydratedUser(req.user!.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

partnerRouter.post("/connect", async (req, res, next) => {
  try {
    const { inviteCode } = inviteSchema.parse(req.body);
    const result = await connectPartners(req.user!.userId, inviteCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

partnerRouter.delete("/disconnect", async (req, res, next) => {
  try {
    const result = await disconnectPartner(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
