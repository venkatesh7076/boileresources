import { Resource, Course, Comment } from "../models/index.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import mongoose from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "course-resources",
    allowed_formats: [
      "jpg",
      "png",
      "gif",
      "doc",
      "docx",
      "pdf",
      "ppt",
      "pptx",
      "mp3",
      "wav",
      "mp4",
      "mov",
    ],
    resource_type: "auto",
  },
});

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Get all resources for a course
export const getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    const course = await Course.findById(courseObjectId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const resources = await Resource.find({
      courseId: courseObjectId,
    })
      .populate("postedBy", "username _id")
      .populate("editHistory.editedBy", "username _id")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "username _id",
        },
      })
      .sort("-datePosted");

    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Error fetching resources" });
  }
};

// Upload a new resource
export const uploadResource = async (req, res) => {
  try {
    console.log("Upload request received:", {
      body: req.body,
      file: req.file,
      user: req.user?._id,
    });

    const { title, description, type, courseId } = req.body;
    const file = req.file;

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
        details: "You must be logged in to upload resources",
      });
    }

    // Validate required fields
    if (!title || !description || !type || !courseId) {
      return res.status(400).json({
        message: "Missing required fields",
        details: "Title, description, type, and courseId are required",
      });
    }

    // Validate file
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
        details: "Please select a file to upload",
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        details: "The specified course does not exist",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image",
      "document",
      "audio",
      "video",
      "pdf",
      "link",
      "other",
    ];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid resource type",
        details: `Resource type must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    // Get file extension from the original filename
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    const allowedExtensions = [
      "jpg",
      "png",
      "gif",
      "doc",
      "docx",
      "pdf",
      "ppt",
      "pptx",
      "mp3",
      "wav",
      "mp4",
      "mov",
    ];

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        message: "Invalid file type",
        details: `File type must be one of: ${allowedExtensions.join(", ")}`,
      });
    }

    console.log("File uploaded to Cloudinary:", file);

    // Create and save the resource
    const resource = new Resource({
      title,
      description,
      type,
      url: file.path || file.secure_url, // Handle both path formats
      fileType: `.${fileExtension}`,
      courseId: new mongoose.Types.ObjectId(courseId),
      postedBy: new mongoose.Types.ObjectId(req.user._id),
      datePosted: new Date(),
    });

    const savedResource = await resource.save();
    console.log("Resource saved:", savedResource);

    // Return the saved resource with populated fields
    const populatedResource = await Resource.findById(savedResource._id)
      .populate("postedBy", "username _id")
      .populate("courseId", "title courseCode");

    res.status(201).json(populatedResource);
  } catch (error) {
    console.error("Error uploading resource:", error);
    // Check for specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate resource",
        details: "A resource with this name already exists",
      });
    }
    res.status(500).json({
      message: "Error uploading resource",
      details: error.message,
    });
  }
};

// Delete a resource
export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this resource" });
    }

    await Resource.findByIdAndDelete(resourceId);
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ message: "Error deleting resource" });
  }
};

// Update a resource
export const updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { title, description } = req.body;

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
        details: "You must be logged in to edit resources",
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if the user is the author of the resource
    if (resource.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to edit this resource",
      });
    }

    // Track changes
    const changes = [];
    if (title && title !== resource.title) {
      changes.push(`title changed from "${resource.title}" to "${title}"`);
      resource.title = title;
    }
    if (description && description !== resource.description) {
      changes.push(
        `description changed from "${resource.description}" to "${description}"`
      );
      resource.description = description;
    }

    // Only update if there are changes
    if (changes.length > 0) {
      resource.lastEdited = new Date();
      resource.editHistory = resource.editHistory || [];
      resource.editHistory.push({
        date: new Date(),
        changes: changes,
        editedBy: req.user._id,
      });

      await resource.save();
    }

    // Get the populated resource with author information
    const populatedResource = await Resource.findById(resourceId)
      .populate("postedBy", "username _id")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "username _id",
        },
      });

    res.json(populatedResource);
  } catch (error) {
    console.error("Error updating resource:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }
    res.status(500).json({
      message: "Error updating resource",
      details: error.message,
    });
  }
};

// Vote on a resource
export const vote = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { voteType } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (voteType === "upvote") {
      resource.upvotes += 1;
    } else if (voteType === "downvote") {
      resource.downvotes += 1;
    }

    await resource.save();
    res.json(resource);
  } catch (error) {
    console.error("Error voting on resource:", error);
    res.status(500).json({ message: "Error voting on resource" });
  }
};

// Create a test resource
/*export const createTestResource = async (req, res) => {
  try {
    const { courseId } = req.params;

    const resource = new Resource({
      title: "Test Resource",
      description: "This is a test resource",
      type: "document",
      url: "https://example.com/test.pdf",
      fileType: "pdf",
      courseId,
      postedBy: req.user._id,
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating test resource:", error);
    res.status(500).json({ message: "Error creating test resource" });
  }
};*/

// Add a comment to a resource
export const addComment = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { content } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
        details: "You must be logged in to post a comment",
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Create a new comment
    const comment = await Comment.create({
      content,
      author: new mongoose.Types.ObjectId(req.user._id),
      resource: new mongoose.Types.ObjectId(resourceId),
      datePosted: new Date(),
    });

    // Add the comment to the resource using the method
    //await resource.addComment(comment._id);

    await comment.save();

    // Add to resource's comments array
    resource.comments.push(comment._id);
    await resource.save();

    // Get the populated comment with author information
    const populatedComment = await Comment.findById(comment._id)
      .populate({
        path: "author",
        select: "username _id",
        //model: "User",
      })
      .exec();

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      message: "Error adding comment",
      details: error.message,
    });
  }
};

// Get comments for a resource
export const getComments = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { sortBy = "newest" } = req.query; // Default to newest first

    const sortOrder = sortBy === "oldest" ? "datePosted" : "-datePosted";

    const comments = await Comment.find({
      resource: resourceId,
      parentComment: null, // Only get top-level comments
    })
      .populate({
        path: "author",
        select: "username _id",
        model: "User",
      })
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username _id",
          model: "User",
        },
        options: { sort: { datePosted: sortBy === "oldest" ? 1 : -1 } },
      })
      .sort(sortOrder);

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

// Edit a comment
export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this comment" });
    }

    comment.content = content;
    await comment.save();

    // Get the populated comment with author information
    const populatedComment = await Comment.findById(commentId).populate(
      "author",
      "username"
    );

    res.json(populatedComment);
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Error editing comment" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { resourceId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Remove the comment from the resource
    const resource = await Resource.findById(resourceId);
    if (resource) {
      resource.comments = resource.comments.filter(
        (id) => id.toString() !== commentId
      );
      await resource.save();
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

// Add a reply to a comment
export const addReply = async (req, res) => {
  try {
    const { resourceId, commentId } = req.params;
    const { content } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
        details: "You must be logged in to post a reply",
      });
    }

    // Find the parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // Verify that the resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Create the reply
    const reply = await Comment.create({
      content,
      author: req.user._id,
      resource: resourceId,
      parentComment: commentId,
      datePosted: new Date(),
    });

    // Add the reply to the resource's comments array
    resource.comments.push(reply._id);
    await resource.save();

    // Get the populated reply with author information
    const populatedReply = await Comment.findById(reply._id)
      .populate({
        path: "author",
        select: "username _id",
        model: "User",
      })
      .exec();

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      message: "Error adding reply",
      details: error.message,
    });
  }
};
