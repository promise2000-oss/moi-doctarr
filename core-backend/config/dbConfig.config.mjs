import mongoose from "mongoose";
import dotenv from "dotenv";
import Logger from "../utils/logger.mjs";

dotenv.config({
  quiet: true,
});

const connectDB = async () => {
  try {
    const mongoURI = process.env.DB_URL;
    if (!mongoURI) {
      Logger.ERROR("Could not find mongodb env file");
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    Logger.SUCCESSFUL("Connection to database cluster succcessful");
  } catch (error) {
    Logger.ERROR("failed to connect to database cluster");
    process.exit(1);
  }
};
mongoose.connection.on("disconnected", () => {
  Logger.WARN("Server disconnected from database clusters");
});
mongoose.connection.on("error", (err) => {
  Logger.ERROR("database cluster runtime error");
});

export default connectDB;
