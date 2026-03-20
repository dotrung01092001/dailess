import { getHydratedUser, getUserRowById, getUserRowByInviteCode, linkPartners, unlinkPartners } from "../lib/store.js";
import { AppError } from "../utils/errors.js";

export async function connectPartners(userId: string, inviteCode: string) {
  const user = await getUserRowById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.partner_id) {
    throw new AppError("Your account is already connected to a partner.", 409);
  }

  const partner = await getUserRowByInviteCode(inviteCode.trim().toUpperCase());

  if (!partner) {
    throw new AppError("Invite code not found.", 404);
  }

  if (partner.id === user.id) {
    throw new AppError("You cannot connect with your own invite code.", 400);
  }

  if (partner.partner_id) {
    throw new AppError("That person is already connected to someone.", 409);
  }

  await linkPartners(user.id, partner.id);

  const hydratedUser = await getHydratedUser(user.id);
  const hydratedPartner = await getHydratedUser(partner.id);

  return { user: hydratedUser, partner: hydratedPartner };
}

export async function disconnectPartner(userId: string) {
  const user = await getUserRowById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.partner_id) {
    throw new AppError("You do not have a connected partner.", 400);
  }

  await unlinkPartners(user.id, user.partner_id);

  return { user: await getHydratedUser(user.id) };
}
