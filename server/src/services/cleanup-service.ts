import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { Moment } from "../models/Moment.js";

export function startUploadCleanupLoop() {
  const uploadRoot = path.resolve(env.UPLOAD_DIR);

  const cleanup = async () => {
    const staleMoments = await Moment.find({ expiresAt: { $lt: new Date() } });

    await Promise.all(
      staleMoments.map(async (moment) => {
        const filePath = path.join(uploadRoot, path.basename(moment.imageUrl));
        await fs.unlink(filePath).catch(() => undefined);
        await moment.deleteOne();
      })
    );
  };

  void cleanup();
  return setInterval(() => {
    void cleanup();
  }, 1000 * 60 * 30);
}

