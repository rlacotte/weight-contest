import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// @ts-expect-error -- no types
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test DB
  try {
    const count = await prisma.user.count();
    results.db = { ok: true, userCount: count };
  } catch (e: any) {
    results.db = { ok: false, error: e.message };
  }

  // Test SMTP
  try {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    await transport.verify();
    results.smtp = { ok: true, host: process.env.EMAIL_SERVER_HOST };
  } catch (e: any) {
    results.smtp = { ok: false, error: e.message, host: process.env.EMAIL_SERVER_HOST };
  }

  // Check env vars presence
  results.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST ?? "MISSING",
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT ?? "MISSING",
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER ? "SET" : "MISSING",
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? "SET" : "MISSING",
    EMAIL_FROM: process.env.EMAIL_FROM ?? "MISSING",
  };

  return NextResponse.json(results);
}
