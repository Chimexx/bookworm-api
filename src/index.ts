import express, { Application } from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes.ts";
import bookRoutes from "./routes/bookRoutes.ts";
import { connectDB } from "./lib/db.ts";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
