
import { io } from "socket.io-client";

const isDev = import.meta.env.MODE === "development";
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

let socketUrl = import.meta.env.VITE_SOCKET_URL;

if (!isDev && socketUrl && socketUrl.includes("localhost") && !isLocalhost) {
    socketUrl = "/";
}

const SOCKET_URL = socketUrl || (isDev ? "http://localhost:5001" : "/");

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
