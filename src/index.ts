import express, { Application } from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import ping from "./routes/ping";
import { connectDB } from "./lib/db";
import { job } from "./lib/cron";
import bodyParser from "body-parser";

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

job.start()

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json({ limit: "10mb" })); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.raw({ type: "application/octet-stream", limit: "5mb" }));

app.use("/api/ping", ping);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
