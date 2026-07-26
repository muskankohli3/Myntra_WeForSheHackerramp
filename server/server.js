const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const initializeSocket = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  // Same reasoning as app.js — reflect the request origin instead of
  // locking to CLIENT_ORIGIN, so Socket.io connects cleanly whether the
  // frontend is opened via localhost or a LAN IP from another device.
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
  });

  initializeSocket(io);
  app.set("io", io);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready, accepting connections from any origin (local prototype)`);
  });
}

start();
