import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError("Invalid token", 401));
  }
}

