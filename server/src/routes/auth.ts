import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getHydratedUser } from "../lib/store.js";
import { loginUser, registerUser } from "../services/user-service.js";
import { loginSchema, registerSchema } from "../validation/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getHydratedUser(req.user!.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});
