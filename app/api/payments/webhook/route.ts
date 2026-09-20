import crypto from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
) {
  const parts = signature.split(",");

  const timestampValue = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);

  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampValue || signatures.length === 0) {
    return false;
  }

  const timestamp = Number(timestampValue);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  // Reject old/replayed webhook requests.
  const age =
    Math.abs(Date.now() / 1000 - timestamp);

  if (age > 300) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestampValue}.${payload}`)
    .digest("hex");

  return signatures.some((signatureValue) => {
    try {
      const actual = Buffer.from(
        signatureValue,
        "hex"
      );

      const target = Buffer.from(
        expected,
        "hex"
      );

      return (
        actual.length === target.length &&
        crypto.timingSafeEqual(actual, target)
      );
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  try {
    const secret =
      process.env.STRIPE_WEBHOOK_SECRET;

    const signature =
      request.headers.get("stripe-signature");

    const payload = await request.text();

    if (
      !secret ||
      !signature ||
      !verifySignature(
        payload,
        signature,
        secret
      )
    ) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(payload);

    const paymentCompleted =
      event.type ===
        "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded";

    if (!paymentCompleted) {
      return NextResponse.json({
        received: true,
      });
    }

    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        received: true,
      });
    }

    const userId =
      session.metadata?.userId;

    const courseId =
      session.metadata?.courseId;

    if (!userId || !courseId) {
      return NextResponse.json({
        received: true,
      });
    }

    await connectDB();

    /*
      Important:
      We only activate an enrollment if this exact
      Stripe session was created by our checkout API.
    */
    const enrollment =
      await Enrollment.findOneAndUpdate(
        {
          user: userId,
          course: courseId,
          paymentSessionId: session.id,
          status: "pending",
        },
        {
          status: "active",
          amountPaid:
            (session.amount_total || 0) / 100,
        },
        {
          new: true,
        }
      );

    if (enrollment) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          purchasedCourses: courseId,
        },
      });
    } else {
      console.warn(
        "Stripe payment received but matching pending enrollment was not found:",
        session.id
      );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}