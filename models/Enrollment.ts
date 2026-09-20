import mongoose, { Schema, models } from "mongoose";

const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
    },
    paymentSessionId: { type: String, default: "" },
    amountPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Enrollment = models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;