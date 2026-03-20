import { cleanupExpiredMoments } from "../lib/store.js";

export function startUploadCleanupLoop() {
  const cleanup = async () => {
    await cleanupExpiredMoments();
  };

  void cleanup();
  return setInterval(() => {
    void cleanup();
  }, 1000 * 60 * 30);
}
