import { nanoid } from "nanoid";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { comparePassword, hashPassword } from "../utils/auth.js";
import { signToken } from "../utils/jwt.js";

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const user = await User.create({
    email,
    displayName: input.displayName.trim(),
    passwordHash: await hashPassword(input.password),
    inviteCode: nanoid(10).toUpperCase()
  });

  return {
    token: signToken({ userId: user._id.toString(), email: String(user.email) }),
    user
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase().trim() });

  if (!user || !(await comparePassword(input.password, String(user.passwordHash)))) {
    throw new AppError("Incorrect email or password.", 401);
  }

  return {
    token: signToken({ userId: user._id.toString(), email: String(user.email) }),
    user
  };
}
