import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function POST(
  request: Request
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    const secret =
      process.env
        .STRIPE_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        {
          message:
            "Stripe is not configured",
        },
        { status: 503 }
      );
    }

    const { courseId } =
      await request.json();

    if (
      !courseId ||
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid course",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const course =
      await Course.findById(
        courseId
      );

    if (
      !course ||
      !course.published
    ) {
      return NextResponse.json(
        {
          message:
            "Course not found",
        },
        { status: 404 }
      );
    }

    if (course.price <= 0) {
      return NextResponse.json(
        {
          message:
            "This course is free and does not require payment.",
        },
        { status: 400 }
      );
    }

    const existing =
      await Enrollment.findOne({
        user: user.id,
        course:
          course._id,
        status: "active",
      });

    if (existing) {
      return NextResponse.json(
        {
          message:
            "You already own this course",
        },
        { status: 409 }
      );
    }

    const appUrl = (
      process.env
        .NEXT_PUBLIC_APP_URL ||
      new URL(
        request.url
      ).origin
    ).replace(/\/$/, "");

    const params =
      new URLSearchParams({
        mode: "payment",

        "line_items[0][price_data][currency]":
          "usd",

        "line_items[0][price_data][product_data][name]":
          course.title,

        "line_items[0][price_data][product_data][description]":
          course.description.slice(
            0,
            500
          ),

        "line_items[0][price_data][unit_amount]":
          String(
            Math.round(
              course.price *
                100
            )
          ),

        "line_items[0][quantity]":
          "1",

        success_url: `${appUrl}/dashboard/my-courses?payment=success`,

        cancel_url: `${appUrl}/dashboard/courses/${course._id}?payment=cancelled`,

        customer_email:
          user.email,

        "metadata[userId]":
          user.id,

        "metadata[courseId]":
          course._id.toString(),
      });

    const response =
      await fetch(
        "https://api.stripe.com/v1/checkout/sessions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${secret}`,
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: params,
        }
      );

    const session =
      await response.json();

    if (!response.ok) {
      console.error(
        "STRIPE CHECKOUT ERROR:",
        session
      );

      return NextResponse.json(
        {
          message:
            session.error
              ?.message ||
            "Stripe checkout failed",
        },
        { status: 502 }
      );
    }

    if (
      !session.id ||
      !session.url
    ) {
      return NextResponse.json(
        {
          message:
            "Stripe did not return a valid checkout session",
        },
        { status: 502 }
      );
    }

    await Enrollment.findOneAndUpdate(
      {
        user: user.id,
        course:
          course._id,
      },
      {
        user: user.id,
        course:
          course._id,

        // Do not activate
        // before payment.
        status: "pending",

        paymentSessionId:
          session.id,

        // Nothing paid yet.
        amountPaid: 0,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert:
          true,
      }
    );

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error(
      "CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Could not start checkout",
      },
      { status: 500 }
    );
  }
}