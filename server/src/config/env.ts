import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/factmesh",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  tavilyApiKey: process.env.TAVILY_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : ["*"],
};

const required = ["openaiApiKey", "tavilyApiKey"] as const;

export function validateEnv() {
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    console.warn(`Missing recommended environment variables: ${missing.join(", ")}`);
    console.warn("API calls will fail until OPENAI_API_KEY and TAVILY_API_KEY are configured.");
  }
}
