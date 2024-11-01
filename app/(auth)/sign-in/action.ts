"use server";
import { signInSchema } from "@/schema";
import { z } from "zod";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";
import {
  generateTwoFactorToken,
  generateVerificationToken,
} from "@/lib/tokens";
import { sendTwoFactorTokenEmail, sendVerificationEmail } from "@/lib/email";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

export const signInAction = async (data: z.infer<typeof signInSchema>) => {
  const validData = signInSchema.safeParse(data);

  if (!validData.success) {
    throw new Error("Invalid data!");
  }
  const validatedData = signInSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid data!" };
  }

  const { email, password, twofactor } = validatedData.data;

  const existingUser = await getUserByEmail(email);
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );
    return { success: "Confirmation email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (twofactor) {
      const twoFactorToken = await getTwoFactorTokenByEmail(email);
      if (!twoFactorToken) {
        return { error: "2FA code expired!", twofactor: false };
      }
      if (twoFactorToken.token !== twofactor) {
        return { error: "Invalid 2FA Code!", twofactor: true };
      }
      if (twoFactorToken.token === twofactor) {
        const expired =
          new Date(twoFactorToken.expires).getTime() - new Date().getTime();
        console.log(expired);
        if (expired < 0) {
          await db.twoFactorToken.delete({
            where: {
              id: twoFactorToken.id,
            },
          });
          const twoFactor = await generateTwoFactorToken(email);
          await sendTwoFactorTokenEmail(twoFactor.email, twoFactor.token);
          return { success: "Two factor token sent!", twofactor: true };
        } else if (expired > 0) {
          await db.twoFactorToken.delete({
            where: {
              id: twoFactorToken.id,
            },
          });
          const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
            existingUser.id,
          );
          if (twoFactorConfirmation) {
            await db.twoFactorConfirmation.delete({
              where: {
                userId: existingUser.id,
              },
            });
          }
          await db.twoFactorConfirmation.create({
            data: {
              userId: existingUser.id,
            },
          });
        }
      }
    } else {
      const twoFactorToken = await getTwoFactorTokenByEmail(email);
      if (!twoFactorToken) {
        const twoFactorCode = await generateTwoFactorToken(email);
        await sendTwoFactorTokenEmail(twoFactorCode.email, twoFactorCode.token);
        return { success: "Two factor token sent!", twofactor: true };
      }
      if (twoFactorToken) {
        const expired =
          new Date(twoFactorToken.expires).getTime() - new Date().getTime();
        if (expired < 0) {
          await db.twoFactorToken.delete({
            where: {
              id: twoFactorToken.id,
            },
          });
          const twoFactor = await generateTwoFactorToken(email);
          await sendTwoFactorTokenEmail(twoFactor.email, twoFactor.token);
          return { success: "Two factor token sent!", twofactor: true };
        } else if (expired > 0) {
          return {
            success:
              "2FA Code already sent!, if u have a problem wait 2 min for the code to expire",
            twofactor: true,
          };
        }
      }
    }
  }

  try {
    let redirect = DEFAULT_LOGIN_REDIRECT;
    const form = await db.form.findFirst({
      where: {
        userId: existingUser.id,
      },
    });
    if (!form) {
      await db.form.create({
        data: {
          userId: existingUser.id,
          status: "forWho",
        },
      });
      redirect = "/form";
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirect,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};
