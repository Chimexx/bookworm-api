import { Request, Response } from "express";
import { Book, IBook } from "../models/Book";
import cloudinary from "../lib/cloudinary";
import {
  AuthenticatedRequest,
  BookInput,
} from "../interfaces/book.interfaces";

export const createBook = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<IBook | Response> => {
  try {
    const { title, description, rating, image } = req.body as BookInput;

    if (!title || !description || !image) {
      return res
        .status(400)
        .json({ message: "Title, description and image are required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { secure_url } = await cloudinary.uploader.upload(image);

    const book = new Book({
      title,
      description,
      rating,
      image: secure_url,
      user: req.user._id,
    });

    await book.save();

    return book;
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
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