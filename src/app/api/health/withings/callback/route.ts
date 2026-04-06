import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/health/withings";
import crypto from "crypto";

function verifyState(state: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, nonce, signature] = parts;
  const secret = process.env.NEXTAUTH_SECRET!;
  const expected = crypto.createHmac("sha256", secret).update(`${userId}.${nonce}`).digest("hex").slice(0, 16);
  if (signature !== expected) return null;
  return userId;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings?withings=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?withings=missing_params`);
  }

  const userId = verifyState(state);
  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/settings?withings=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.health_integrations.upsert({
      where: { user_id_provider: { user_id: userId, provider: "withings" } },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        sync_enabled: true,
        metadata: { userid: tokens.userid, scope: tokens.scope },
      },
      create: {
        user_id: userId,
        provider: "withings",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        sync_enabled: true,
        metadata: { userid: tokens.userid, scope: tokens.scope },
      },
    });

    // Trigger initial sync
    const syncUrl = new URL("/api/health/withings/sync", baseUrl);
    fetch(syncUrl, {
      method: "POST",
      headers: { Cookie: request.headers.get("cookie") ?? "" },
    }).catch(() => {
      // ignore, user can sync manually
    });

    return NextResponse.redirect(`${baseUrl}/settings?withings=connected`);
  } catch (err) {
    console.error("Withings callback error:", err);
    return NextResponse.redirect(`${baseUrl}/settings?withings=error`);
  }
}
