
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === "development" ? "http://localhost:5001" : "/");

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false,
        });
    }
    return socket;
};
