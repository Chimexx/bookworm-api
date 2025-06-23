import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database connection successful ${connection.connection.host}`);
  } catch (error) {
    console.log(`Error connecting to database: ${error}`);
    process.exit(1);
  }
};
