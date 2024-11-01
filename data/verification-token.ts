import { db } from "@/lib/db";

export const getVerificationTokenByToken = async (token: string) => {
  const verificationToken = await db.verificationToken.findUnique({
    where: {
      token,
    },
  });

  return verificationToken;
};
export const getVerificationTokenByEmail = async (email: string) => {
  const verificationToken = await db.verificationToken.findFirst({
    where: {
      email,
    },
  });

  return verificationToken;
};