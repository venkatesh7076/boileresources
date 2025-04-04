import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import axios from "axios";

// WebSocket connection
const socket = io("http://localhost:5001", { withCredentials: true });

const Chat = ({ userId }) => {
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;

    console.log("✅ groupId from URL:", groupId);
    socket.emit("joinGroup", groupId);

    // Initial load for message history
    fetchMessages();

    socket.on("receiveMessage", (message) => {
      console.log("📥 Received real-time message:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [groupId]);

  const fetchMessages = async () => {
    console.log("📡 Fetching messages from backend (page", page, ")...");

    try {
      const res = await axios.get(`http://localhost:5001/api/messages/${groupId}`, {
        params: { page, limit: 20 },
      });

      if (!res.data.messages || res.data.messages.length === 0) {
        console.log("🛑 No more messages found.");
        setHasMore(false);
        return;
      }

      const reversed = res.data.messages.reverse(); // oldest messages on top
      console.log("✅ Messages received:", reversed);

      setMessages((prevMessages) => [...reversed, ...prevMessages]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("❌ Error fetching messages:", error.message);
    }
  };

  const sendMessage = () => {
    if (!groupId || !userId || !text.trim()) {
      console.error("❌ groupId, senderId, or text is missing!");
      return;
    }

    console.log("📤 Sending message:", { groupId, senderId: userId, text });
    socket.emit("sendMessage", { groupId, senderId: userId, text });
    setText(""); // Clear input
  };

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
      <h2>Group Chat</h2>
      <p><strong>Group ID:</strong> {groupId}</p>

      {/* Load older messages button */}
      <button
        onClick={fetchMessages}
        disabled={!hasMore}
        style={{ marginBottom: "10px", cursor: hasMore ? "pointer" : "not-allowed" }}
      >
        {hasMore ? "Load Older Messages" : "No More Messages"}
      </button>

      {/* Message window */}
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: "5px" }}>
              <strong>{msg.senderId}:</strong> {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input + Send */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "80%", padding: "8px", marginRight: "5px" }}
      />
      <button onClick={sendMessage} style={{ padding: "8px", cursor: "pointer" }}>
        Send
      </button>
    </div>
  );
};

export default Chat;
