import { Router } from "express";
import { createBook, deleteBook, getBook, getBooks, getUserBooks } from "../services/book.service";
import { authGuard } from "../middlewares/auth.middleware";
import { uploadImageMiddleware } from "../middlewares/upload.middlewares";
import { AuthenticatedRequest } from "../interfaces/book.interfaces";
const router = Router();


// uploadImageMiddleware

router.post("/",authGuard, async (req, res) => {
  try {
    const book = await createBook(req, res);
    res.status(201).json(book);
  } catch (err: any) {
    console.error("Book creation error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: err.message || "Failed to create book.",
      });
    }
  }
});


router.get("/",authGuard, async (req, res) => {
  await getBooks(req, res);
});

router.get("/:id",authGuard, async (req, res) => {
  await getBook(req, res);
});

router.get("/user",authGuard, async (req, res) => {
  await getUserBooks(req, res);
});

router.delete("/:id", authGuard, async (req, res) => {
  await deleteBook(req, res);
});

export default router;
