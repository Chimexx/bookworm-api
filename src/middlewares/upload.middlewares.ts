import multer, { FileFilterCallback, MulterError } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Extend the Request type to include `file`
declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
  }
}

const uploadDir = path.resolve(__dirname, "../../uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory at: ${uploadDir}`);
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Image-only filter
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Initialize multer with config
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});

// Middleware wrapper
export const uploadImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("image")(req, res, (err: any) => {
      console.log("File:", req.file);
      console.log("Body:", req.body);
    if (err instanceof MulterError) {
      console.error("Multer error:", err.message);
      const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(statusCode).json({ message: err.message });
    }

    if (err) {
      console.error("Upload error:", err.message);
      const statusCode =
        err.message === "Only image files are allowed!" ? 415 : 500;
      return res.status(statusCode).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }
    
    next();
  });
};
