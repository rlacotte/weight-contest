import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const contestId = session.metadata?.contest_id;
    const userId = session.metadata?.user_id;

    if (contestId && userId) {
      await prisma.contest_bets.updateMany({
        where: { contest_id: contestId, user_id: userId },
        data: { status: "paid", stripe_payment_intent_id: session.payment_intent as string },
      });
      await prisma.contest_members.updateMany({
        where: { contest_id: contestId, user_id: userId },
        data: { status: "approved" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
