import { Router } from "express";
import { createBook, deleteBook, getBook, getBooks, getUserBooks } from "../services/book.service";
import { authGuard } from "../middlewares/auth.middleware";
const router = Router();

router.post("/", authGuard, async (req, res) => {
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

router.get("/user", authGuard, async (req, res) => {
  try {
    await getUserBooks(req, res);
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Failed to fetch user books",
    });
  }
});


router.get("/:id",authGuard, async (req, res) => {
  await getBook(req, res);
});

router.delete("/:id", authGuard, async (req, res) => {
  await deleteBook(req, res);
});

export default router;
