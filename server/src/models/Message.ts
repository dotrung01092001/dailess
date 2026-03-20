import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationKey: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    seenAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Message = model("Message", messageSchema);

