import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/health/withings";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  // Encode user ID into state (signed to prevent tampering)
  const secret = process.env.NEXTAUTH_SECRET!;
  const userId = session.user.id;
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${userId}.${nonce}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  const state = `${payload}.${signature}`;

  return NextResponse.redirect(getAuthorizationUrl(state));
}
