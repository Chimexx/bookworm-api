import express, { Application } from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import ping from "./routes/ping";
import { connectDB } from "./lib/db";
import { job } from "./lib/cron";

const app: Application = express();
const PORT = process.env.PORT || 3000;

job.start()

// app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/ping", ping);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
