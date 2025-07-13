import { Request, Response } from "express";
import { Book, IBook } from "../models/Book";
import cloudinary, { uploadToCloudinary } from "../lib/cloudinary";
import {
  AuthenticatedRequest,
  BookInput,
} from "../interfaces/book.interfaces";
import fs from "fs";

export const createBook = async (req: AuthenticatedRequest, res: Response): Promise<IBook> => {
  // Extract text fields from req.body
  const { title, description, rating } = req.body as BookInput;

  // Access the uploaded file from req.file
  const uploadedFile = req.file;

  // --- 1. Server-side Validation ---
  if (!title || !description || rating === undefined || rating === null) {
    // Clean up temporary file if validation fails here
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
    throw new Error('Title, description, and rating are required.');
  }

  // Validate rating value
  const parsedRating = parseFloat(rating.toString()); 

  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
    throw new Error('Rating must be a number between 1 and 5.');
  }

  // Ensure an image file was provided
  // if (!uploadedFile) {
  //   throw new Error('Image file is required for the book cover.');
  // }

  let secure_url: string = "";
  
  if (uploadedFile) {
    try {
      secure_url = await uploadToCloudinary(uploadedFile.path);
  
    } catch (error) {
      // Re-throw Cloudinary error as a service error
      console.error("Error calling uploadToCloudinary:", error);
      throw new Error('Failed to upload book cover image.');
    }
  }

  // Save Book Data to Database ---
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
    throw new Error("Failed to save book data to the database.");
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

    if (book.image && book.image.includes("cloudinary")) {
      try {
        let publicId: string | undefined;
        if (book.image) {
          const parts = book.image.split("/");
          const lastPart = parts.pop();
          publicId = lastPart ? lastPart.split(".")[0] : undefined;
        }
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Error deleting image from cloud" });
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
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip: number = (page - 1) * limit;

    const books = await Book.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profileImage");

    const totalUserBooks = await Book.countDocuments({ user: req.user._id });

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