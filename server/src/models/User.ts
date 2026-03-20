import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const safeRet = ret as Record<string, unknown>;
        safeRet.id = _doc._id.toString();
        delete safeRet._id;
        delete safeRet.__v;
        delete safeRet.passwordHash;
        return safeRet;
      }
    }
  }
);

export const User = model("User", userSchema);
