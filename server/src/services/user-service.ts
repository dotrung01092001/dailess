import { nanoid } from "nanoid";
import { createUserRow, getUserRowByEmail } from "../lib/store.js";
import { AppError } from "../utils/errors.js";
import { comparePassword, hashPassword } from "../utils/auth.js";
import { signToken } from "../utils/jwt.js";

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await getUserRowByEmail(email);

  if (existing) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const user = await createUserRow({
    email,
    displayName: input.displayName.trim(),
    passwordHash: await hashPassword(input.password)
  });

  return {
    token: signToken({ userId: user.id, email: user.email }),
    user
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await getUserRowByEmail(input.email.toLowerCase().trim());

  if (!user || !(await comparePassword(input.password, String(user.password_hash)))) {
    throw new AppError("Incorrect email or password.", 401);
  }

  return {
    token: signToken({ userId: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      inviteCode: user.invite_code,
      partnerId: user.partner_id
    }
  };
}
