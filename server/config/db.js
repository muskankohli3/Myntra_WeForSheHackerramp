const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "❌ MONGO_URI is not set. Copy server/.env.example to server/.env and set MONGO_URI before starting the server."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "   Check that MONGO_URI in server/.env is correct and that MongoDB (local or Atlas) is reachable."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
