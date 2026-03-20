import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";

export async function connectPartners(userId: string, inviteCode: string) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.partnerId) {
    throw new AppError("Your account is already connected to a partner.", 409);
  }

  const partner = await User.findOne({ inviteCode: inviteCode.trim().toUpperCase() });

  if (!partner) {
    throw new AppError("Invite code not found.", 404);
  }

  if (partner.id === user.id) {
    throw new AppError("You cannot connect with your own invite code.", 400);
  }

  if (partner.partnerId) {
    throw new AppError("That person is already connected to someone.", 409);
  }

  user.partnerId = partner._id;
  partner.partnerId = user._id;

  await Promise.all([user.save(), partner.save()]);

  return { user, partner };
}

export async function disconnectPartner(userId: string) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.partnerId) {
    throw new AppError("You do not have a connected partner.", 400);
  }

  const partner = await User.findById(user.partnerId);

  user.partnerId = null;

  if (partner) {
    partner.partnerId = null;
    await partner.save();
  }

  await user.save();

  return { user };
}
