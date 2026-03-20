import { Schema, model } from "mongoose";

const momentSchema = new Schema(
  {
    conversationKey: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true },
    filter: { type: String, default: "soft" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

export const Moment = model("Moment", momentSchema);

