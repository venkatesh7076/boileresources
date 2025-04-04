import React from "react";

const Messages = ({ messages = [] }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4">
      {messages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
      ) : (
        messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.senderId}:</strong> {msg.text}
          </div>
        ))
      )}
    </div>
  );
};

export default Messages;
