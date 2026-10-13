import mongoose from "mongoose";

export async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ CRITICAL ERROR: The MONGODB_URI environment variable is not configured!");
    throw new Error("MONGODB_URI is not defined");
  }

  // Remove potential superfluous quotes
  uri = uri.trim().replace(/^["']|["']$/g, "");

  const safeTarget = uri.includes("@") ? uri.split("@")[1].split("?")[0] : "local";
  console.log(`📡 Connecting to MongoDB Atlas (${safeTarget})...`);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
  });
  console.log("✅ Successfully connected to MongoDB Atlas!");
}
