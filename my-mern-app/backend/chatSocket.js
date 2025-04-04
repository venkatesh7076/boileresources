import mongoose from "mongoose";
import Message from "./models/Message.js"; // Ensure the path is correct

const chatSocketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(` User connected: ${socket.id}`);

    // Handle joining a group chat
    socket.on("joinGroup", (groupId) => {
      if (!groupId) {
        console.error("Error: groupId is missing");
        socket.emit("error", { message: "Missing groupId" });
        return;
      }

      socket.join(groupId);
      console.log(`📢 User ${socket.id} joined group ${groupId}`);
    });

    // Handle sending messages
    socket.on("sendMessage", async (messageData) => {
      let { groupId, senderId, text } = messageData;

      console.log("Received messageData:", messageData); // Debugging log

      try {
        // Check if values are missing
        if (!groupId || !senderId || !text) {
          console.error("Error: Missing required fields");
          socket.emit("error", { message: "Missing groupId, senderId, or text" });
          return;
        }

        // Validate ObjectId format before conversion
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
          console.error(`Invalid groupId: ${groupId}`);
          socket.emit("error", { message: "Invalid groupId format" });
          return;
        }
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
          console.error(`Invalid senderId: ${senderId}`);
          socket.emit("error", { message: "Invalid senderId format" });
          return;
        }

        // Convert to ObjectId
        const groupObjectId = new mongoose.Types.ObjectId(groupId);
        const senderObjectId = new mongoose.Types.ObjectId(senderId);

        // Save message to MongoDB
        const message = new Message({ groupId: groupObjectId, senderId: senderObjectId, text });
        await message.save();

        console.log(`Message saved in group ${groupId}: ${text}`);

        // Broadcast message to group members
        io.to(groupId.toString()).emit("receiveMessage", {
          senderId,
          text,
          groupId,
          createdAt: message.createdAt,
        });

      } catch (err) {
        console.error(" Error saving message:", err);
        socket.emit("error", { message: "Message save failed" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(` User disconnected: ${socket.id}`);
    });
  });
};

export default chatSocketHandler;
