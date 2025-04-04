import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish WebSocket connection
    const newSocket = io("http://localhost:5001", {
        withCredentials: true, //  Fixes CORS issue
        transports: ["websocket"], //  Use WebSocket transport instead of polling
      });    setSocket(newSocket);

    // Clean up on component unmount
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
