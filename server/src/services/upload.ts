import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
    }
  }),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

