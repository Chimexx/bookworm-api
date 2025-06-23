import { Router } from "express";
import { createBook, deleteBook, getBook, getBooks, getUserBooks } from "../services/book.service.ts";
import { authGuard } from "../middlewares/auth.middleware.ts";

const router = Router();

router.post("/", authGuard, async (req, res) => {
  const book = await createBook(req, res);
  return res.status(201).json(book);
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
