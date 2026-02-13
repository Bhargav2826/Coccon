
import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuth();

    // Choose URL based on environment
    // In development: "http://localhost:5001" (since we use a proxy in vite, but socket might need direct URL if not proxied correctly, or relative path "/")
    // In production: "/"
    const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

    useEffect(() => {
        if (authUser) {
            const socket = io(SOCKET_URL, {
                query: {
                    userId: authUser._id,
                },
            });

            setSocket(socket);

            socket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Heartbeat to update lastSeen every 2 minutes while user is active
            const heartbeatInterval = setInterval(() => {
                if (socket && socket.connected) {
                    socket.emit("heartbeat");
                }
            }, 2 * 60 * 1000); // Every 2 minutes

            return () => {
                clearInterval(heartbeatInterval);
                socket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
