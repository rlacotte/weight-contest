import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "email-smtp.eu-west-3.amazonaws.com",
        port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
        secure: true,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@weightcontest.app",
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify",
    newUser: "/auth/onboarding",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.profiles.create({
        data: {
          user_id: user.id!,
        },
      });
    },
  },
});
