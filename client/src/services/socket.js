import { io } from "socket.io-client";

// Connects to the same host the page was loaded from, on the backend's port.
// This is what makes the two-physical-devices test work: a phone on the same
// WiFi opening http://<host-lan-ip>:5173 will connect its socket to
// http://<host-lan-ip>:5000, not "localhost" (which would mean the phone itself).
const backendHost = window.location.hostname;
const SOCKET_URL = `http://${backendHost}:5000`;

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

socket.on("connect_error", (err) => {
  console.warn("Socket connection error (is the backend running on port 5000?):", err.message);
});

export default socket;
