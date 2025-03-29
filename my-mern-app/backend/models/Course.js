import mongoose from "mongoose";
const { Schema } = mongoose;

// Main Course Schema
const courseSchema = new Schema(
  {
    courseId: {
      type: Number,
      unique: true,
    },
    title: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    courseCode: { type: String, required: true, trim: true },
    instructor: [{ type: String }], // Array of instructors
    professor: { type: String, trim: true },
    professorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    description: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 0 },
    credits: { type: Number }, // Academic credits
    creditHours: { type: Number, min: 1 }, // Credit hours
    term: { type: String },
    crn: [{ type: Number, default: [] }],
    sched: [{ type: String, default: [] }],
    type: {
      type: String,
      enum: ["Lecture", "Lab", "Seminar", "Workshop", "Online"],
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }], // References to Resource documents
    users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // Tracks enrolled users
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the Course model
const Course = mongoose.model("Course", courseSchema);
export default Course;
