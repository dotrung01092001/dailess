import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import http from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { partnerRouter } from "./routes/partners.js";
import { messageRouter } from "./routes/messages.js";
import { momentRouter } from "./routes/moments.js";
import { errorHandler } from "./middleware/error.js";
import { createSocketServer } from "./lib/socket.js";
import { startUploadCleanupLoop } from "./services/cleanup-service.js";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/partner", partnerRouter);
app.use("/api/messages", messageRouter);
app.use("/api/moments", momentRouter);
app.use(errorHandler);

async function start() {
  await connectDatabase();
  createSocketServer(server);
  startUploadCleanupLoop();

  server.listen(env.PORT, () => {
    console.log(`Dailess server is listening on ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
