import { Request, Response } from "express";
import { Book, IBook } from "../models/Book";
import cloudinary, { deleteImageFromCloudinary, uploadToCloudinary } from "../lib/cloudinary";
import {
  AuthenticatedRequest,
} from "../interfaces/book.interfaces";
import fs from "fs";
import path from "path";

export const createBook = async (req: AuthenticatedRequest, res: Response): Promise<IBook> => {
  const { title, description, rating, image} = req?.body;

  const UPLOAD_DIR = path.join(__dirname, "../uploads");

  if (!title || !description || rating === undefined || rating === null) {
    throw new Error('Title, description, and rating are required.');
  }

  let secure_url: string = "";
  let tempFilePath: string = "";

  if (image?.base64) {
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
 
      const base64Data = image.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
 
      // generate unique filename
      const extension = image.type?.split("/")[1] || "jpg";
      const tempFilename = `${Math.random().toString(36)}.${extension}`;
      tempFilePath = path.join(UPLOAD_DIR, tempFilename);
 
      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, buffer);
 
      // Upload the file to Cloudinary
      secure_url = await uploadToCloudinary(tempFilePath);
      
    } catch (error) {
      throw new Error("Failed to upload book cover image.");
    }
  }

  const parsedRating = parseFloat(rating.toString()); 

  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new Error('Rating must be a number between 1 and 5.');
  }

  try {
    const book = new Book({
      title,
      description,
      rating: parsedRating,
      image: secure_url,
      user: req?.user?._id, 
    });

    await book.save();
    return book;
  } catch (dbError) {
    console.error("Error saving book to database:", dbError);
    //TODO: Delete the Cloudinary image if saving to DB fails after Cloudinary upload.
    throw new Error((dbError as Error).message || "Failed to save book data to the database.");
  }
};

export const getBooks = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip: number = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profileImage");

    const totalBooks = await Book.countDocuments();

    return res.json({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};

export const getBook = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "user",
      "userName"
    );
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.json(book);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};

export const deleteBook = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ message: "User not authenticated" });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (book.image && book.image.includes("res.cloudinary.com")) {
    try {
      const urlParts = book.image.split("/");

      const uploadIndex = urlParts.findIndex((part) => part === "upload");
      if (uploadIndex === -1) {
        throw new Error("Invalid Cloudinary URL format");
      }
          
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join("/");

      const publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");

      if (publicId) {
        await deleteImageFromCloudinary(publicId);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      return res
        .status(400)
        .json({ message: "Error deleting image from Cloudinary" });
    }
    }

    await book.deleteOne();
    return res.json({ message: "Book deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};

export const getUserBooks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip: number = (page - 1) * limit;

    const books = await Book.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profileImage");

    const totalUserBooks = await Book.countDocuments({ user: req.user.id });

    return res.json({
      books,
      currentPage: page,
      totalBooks: totalUserBooks,
      totalPages: Math.ceil(totalUserBooks / limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};