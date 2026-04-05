import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contestId } = await request.json();
  const contest = await prisma.contests.findUnique({ where: { id: contestId }, select: { name: true, entry_fee_cents: true } });
  if (!contest) return NextResponse.json({ error: "Contest not found" }, { status: 404 });

  await prisma.contest_bets.upsert({
    where: { contest_id_user_id: { contest_id: contestId, user_id: session.user.id } },
    update: {},
    create: { contest_id: contestId, user_id: session.user.id, amount_cents: contest.entry_fee_cents, status: "pending" },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price_data: { currency: "usd", product_data: { name: `Entry: ${contest.name}` }, unit_amount: contest.entry_fee_cents }, quantity: 1 }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/contests/${contestId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/contests/${contestId}?payment=cancelled`,
    metadata: { contest_id: contestId, user_id: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
