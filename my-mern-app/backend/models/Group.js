import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class", // Assuming there's a Class model
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false, // Public by default
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Group admin (creator)
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users who are members of the group
      },
    ],
    joinRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
