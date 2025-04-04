import mongoose from "mongoose";

const professorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: true,
    },
    office: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    coursesTaught: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // Reference to Course model
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const Professor = mongoose.model("Professor", professorSchema);

export default Professor;