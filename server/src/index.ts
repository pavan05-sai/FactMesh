import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { Server as SocketServer } from "socket.io";
import { validateEnv, env } from "./config/env";
import { connectDB } from "./config/db";
import { authRoutes } from "./routes/auth";
import { runRoutes } from "./routes/runs";
import { dashboardRoutes } from "./routes/dashboard";
import { registerSocketHandlers } from "./sockets/handler";

validateEnv();

const app = express();
const server = http.createServer(app);

// Trust proxy for PaaS environments like Render/Heroku
app.set("trust proxy", 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for API server to avoid blocking Socket.IO
  })
);

// Dynamic CORS configuration
const corsOrigins = env.allowedOrigins.includes("*")
  ? "*"
  : env.allowedOrigins;

const corsOptions = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO with CORS
const io = new SocketServer(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 authentication attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login/registration attempts, please try again later" },
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/dashboard", dashboardRoutes);

// App locals binding for Socket.IO
app.locals.io = io;

// Production health check probe
app.get("/api/health", (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    environment: env.nodeEnv,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

registerSocketHandlers(io);

async function start() {
  await connectDB();
  server.listen(env.port, () => {
    console.log(`FactMesh Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
}

start();

export { io };
