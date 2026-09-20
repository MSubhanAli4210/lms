import mongoose, { Schema, models } from "mongoose";

const lessonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    order: {
      type: Number,
      default: 1,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lesson =
  models.Lesson || mongoose.model("Lesson", lessonSchema);

export default Lesson;