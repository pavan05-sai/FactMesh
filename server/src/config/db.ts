import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env";

// Ensure DNS SRV resolution works reliably on Windows environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Fallback if system DNS restricts manual server assignment
}

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
