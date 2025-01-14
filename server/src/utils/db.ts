import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/woltDB"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
