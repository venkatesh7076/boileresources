import mongoose from "mongoose";
const { Schema } = mongoose;

// Comment Schema for Resources
const commentSchema = new Schema({
  text: { type: String, required: true, trim: true },
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  datePosted: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
});

// Resource Schema for Course Resources
const resourceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  resourceType: {
    type: String,
    enum: ["pdf", "video", "link", "notes", "image", "other"],
    default: "pdf",
    required: true,
  },
  resourceUrl: { type: String },
  fileUrl: { type: String },
  publicId: { type: String },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedByName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  // Track users who have voted and their vote type
  voters: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      voteType: { type: String, enum: ["up", "down"] },
    },
  ],
  comments: [commentSchema],
  fileType: {
    type: String,
    enum: [
      ".jpg",
      ".png",
      ".gif",
      ".doc",
      ".docx",
      ".pdf",
      ".ppt",
      ".pptx",
      ".mp3",
      ".wav",
      ".mp4",
      ".mov",
    ],
    default: null,
  },
  shareLink: { type: String, default: null },
});

// Add resourceSchema methods
resourceSchema.methods.upvote = function (user) {
  // Find if user has already voted
  const existingVoteIndex = this.voters.findIndex(
    (vote) => vote.user.toString() === user._id.toString()
  );

  if (existingVoteIndex > -1) {
    const existingVote = this.voters[existingVoteIndex];

    // If already upvoted, remove the upvote (toggle off)
    if (existingVote.voteType === "up") {
      this.upvotes -= 1;
      this.voters.splice(existingVoteIndex, 1);
      return true;
    }

    // If previously downvoted, change to upvote
    if (existingVote.voteType === "down") {
      this.downvotes -= 1;
      this.upvotes += 1;
      existingVote.voteType = "up";
      return true;
    }
  } else {
    // New upvote
    this.upvotes += 1;
    this.voters.push({
      user: user._id,
      voteType: "up",
    });
    return true;
  }

  return false;
};

resourceSchema.methods.downvote = function (user) {
  // Find if user has already voted
  const existingVoteIndex = this.voters.findIndex(
    (vote) => vote.user.toString() === user._id.toString()
  );

  if (existingVoteIndex > -1) {
    const existingVote = this.voters[existingVoteIndex];

    // If already downvoted, remove the downvote (toggle off)
    if (existingVote.voteType === "down") {
      this.downvotes -= 1;
      this.voters.splice(existingVoteIndex, 1);
      return true;
    }

    // If previously upvoted, change to downvote
    if (existingVote.voteType === "up") {
      this.upvotes -= 1;
      this.downvotes += 1;
      existingVote.voteType = "down";
      return true;
    }
  } else {
    // New downvote
    this.downvotes += 1;
    this.voters.push({
      user: user._id,
      voteType: "down",
    });
    return true;
  }

  return false;
};

resourceSchema.methods.addComment = function (comment) {
  this.comments.push(comment);
  return true;
};

resourceSchema.methods.generateShareLink = function () {
  // Generate a unique share link
  this.shareLink = `${process.env.APP_URL}/resources/${this._id}`;
  return this.shareLink;
};

resourceSchema.pre("save", function (next) {
  if (!this.shareLink) {
    this.generateShareLink();
  }
  next();
});

resourceSchema.methods.getAttribute = function (name) {
  // Return the attribute value based on the name
  return this[name];
};

resourceSchema.methods.setAttribute = function (name, value) {
  // Set the attribute value based on the name
  this[name] = value;
};

// Create and export the Resource model
const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
