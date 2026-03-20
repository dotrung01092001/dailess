import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "../config/env.js";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (error) {
    if (env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("Primary MongoDB connection failed. Falling back to in-memory MongoDB for local development.");
    console.warn(error);
    memoryServer = await MongoMemoryServer.create({
      binary: {
        version: "7.0.14"
      }
    });
    await mongoose.connect(memoryServer.getUri());
    console.log("Connected to in-memory MongoDB.");
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
