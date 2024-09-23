import config from "config";
import mongoose from "mongoose";

async function connectDB() {
    const dbUri = config.get("DB_URI");

    if (!dbUri) {
        console.error("DB_URI is not set in config.");
        return; // Exit if DB_URI is not set to prevent application crash
    }

    try {
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5000ms instead of 30000ms
            socketTimeoutMS: 3000 // Close sockets after 45 seconds of inactivity
        });
        console.log(`MongoDB Connected: ${dbUri}`);
    } catch (error) {
        console.error(`Failed to connect to MongoDB at ${dbUri}: ${error}`);
    }
}

connectDB();
