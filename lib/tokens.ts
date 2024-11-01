import { getVerificationTokenByEmail } from "@/data/verification-token";
import { getForgotPasswordTokenByEmail } from "@/data/forgot-password-token";

import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(new Date().getTime() + 60 * 2 * 1000);
  const existingToken = await getTwoFactorTokenByEmail(email);

  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
  return twoFactorToken;
};

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 60 * 2 * 1000);
  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
  return verificationToken;
};

export const generateForgotPasswordToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 60 * 2 * 1000);
  const existingToken = await getForgotPasswordTokenByEmail(email);

  if (existingToken) {
    await db.forgotPasswordToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const forgotPasswordToken = await db.forgotPasswordToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
  return forgotPasswordToken;
};
