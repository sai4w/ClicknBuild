import { DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  twofactor: boolean;
  provider: string;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
