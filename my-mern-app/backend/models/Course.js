import mongoose from "mongoose";
const { Schema } = mongoose;

// Define a Comment schema for resources
const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  }
});

// Define a comprehensive Resource schema based on the diagram
const resourceSchema = new Schema({
  resourceId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'link', 'document', 'other'],
    default: 'other',
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileType: {
    type: String,
    trim: true
  },
  shareLink: {
    type: String,
    trim: true
  }
});

// Add methods to the resourceSchema for the functionality shown in the diagram
resourceSchema.methods.upvote = function(user) {
  // Check if user has already voted
  // Implement your voting logic here
  this.upvotes += 1;
  return true;
};

resourceSchema.methods.downvote = function(user) {
  // Check if user has already voted
  // Implement your voting logic here
  this.downvotes += 1;
  return true;
};

resourceSchema.methods.addComment = function(comment) {
  this.comments.push(comment);
  return true;
};

resourceSchema.methods.generateShareLink = function() {
  // Generate a unique share link
  this.shareLink = `${process.env.APP_URL}/resources/${this._id}`;
  return this.shareLink;
};

resourceSchema.methods.getAttribute = function(name) {
  // Return the attribute value based on the name
  return this[name];
};

resourceSchema.methods.setAttribute = function(name, value) {
  // Set the attribute value based on the name
  this[name] = value;
};

// Define the Course schema
const courseSchema = new Schema(
  {
    courseId: {
      type: Number,
      required: true,
      unique: true
    },
    courseCode: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    professor: {
      type: String,
      required: true,
      trim: true
    },
    professorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1
    },
    type: {
      type: String,
      required: true,
      enum: ['Lecture', 'Lab', 'Seminar', 'Workshop', 'Online'],
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    resources: [resourceSchema],
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields automatically
  }
);

// Create models
const Resource = mongoose.model("Resource", resourceSchema);
const Course = mongoose.model("Course", courseSchema);

export { Course, Resource };
export default Course;