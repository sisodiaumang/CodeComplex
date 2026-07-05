import mongoose from "mongoose";
import { DB_NAME } from "../constants/constant.js";
import { env } from "../config/env.js";

const connectDB = async () => {
    try {
        const connectionString = env.MONGODB_URI.endsWith(`/${DB_NAME}`)
            ? env.MONGODB_URI
            : `${env.MONGODB_URI}/${DB_NAME}`;

        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`\n MongoDB connected : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1);
    }
};
export default connectDB;