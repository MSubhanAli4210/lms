import crypto from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

function verifySignature(payload: string, signature: string, secret: string) {
  const timestamp = signature.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const signatures = signature.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((value) => {
    const actual = Buffer.from(value);
    const target = Buffer.from(expected);
    return actual.length === target.length && crypto.timingSafeEqual(actual, target);
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!secret || !signature || !verifySignature(payload, signature, secret)) {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, courseId } = session.metadata || {};
    if (userId && courseId) {
      await connectDB();
      await Enrollment.findOneAndUpdate(
        { user: userId, course: courseId },
        { status: "active", paymentSessionId: session.id, amountPaid: (session.amount_total || 0) / 100 },
        { upsert: true }
      );
      await User.findByIdAndUpdate(userId, { $addToSet: { purchasedCourses: courseId } });
    }
  }

  return NextResponse.json({ received: true });
}