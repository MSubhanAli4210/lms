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
  const parts =
    signature.split(",");

  const timestampValue =
    parts
      .find((part) =>
        part.startsWith("t=")
      )
      ?.slice(2);

  const signatures =
    parts
      .filter((part) =>
        part.startsWith(
          "v1="
        )
      )
      .map((part) =>
        part.slice(3)
      );

  if (
    !timestampValue ||
    signatures.length === 0
  ) {
    return false;
  }

  const timestamp =
    Number(timestampValue);

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return false;
  }

  // Stripe recommends checking
  // timestamp tolerance.
  const age = Math.abs(
    Date.now() / 1000 -
      timestamp
  );

  if (age > 300) {
    return false;
  }

  const expected =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${timestampValue}.${payload}`
      )
      .digest("hex");

  return signatures.some(
    (signatureValue) => {
      try {
        const actual =
          Buffer.from(
            signatureValue,
            "hex"
          );

        const target =
          Buffer.from(
            expected,
            "hex"
          );

        return (
          actual.length ===
            target.length &&
          crypto.timingSafeEqual(
            actual,
            target
          )
        );
      } catch {
        return false;
      }
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const secret =
      process.env
        .STRIPE_WEBHOOK_SECRET;

    const signature =
      request.headers.get(
        "stripe-signature"
      );

    const payload =
      await request.text();

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
        {
          message:
            "Invalid webhook signature",
        },
        { status: 400 }
      );
    }

    const event =
      JSON.parse(payload);

    const validPaymentEvent =
      event.type ===
        "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded";

    if (!validPaymentEvent) {
      return NextResponse.json({
        received: true,
      });
    }

    const session =
      event.data.object;

    if (
      session.payment_status !==
      "paid"
    ) {
      return NextResponse.json({
        received: true,
      });
    }

    const userId =
      session.metadata?.userId;

    const courseId =
      session.metadata?.courseId;

    if (
      !userId ||
      !courseId ||
      !session.id
    ) {
      console.warn(
        "Stripe session missing metadata"
      );

      return NextResponse.json({
        received: true,
      });
    }

    await connectDB();

    /*
      The Stripe session ID must
      match the checkout session
      saved by our application.

      No upsert here.
    */
    const enrollment =
      await Enrollment.findOneAndUpdate(
        {
          user: userId,
          course: courseId,
          paymentSessionId:
            session.id,
        },
        {
          status: "active",
          amountPaid:
            Number(
              session.amount_total ||
                0
            ) / 100,
        },
        {
          new: true,
        }
      );

    if (!enrollment) {
      console.warn(
        "No matching enrollment for Stripe session:",
        session.id
      );

      return NextResponse.json({
        received: true,
      });
    }

    // Safe to run repeatedly.
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          purchasedCourses:
            courseId,
        },
      }
    );

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}