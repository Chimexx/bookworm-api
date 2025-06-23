import { Router } from "express";
import { login, register } from "../services/auth.service";

const router = Router();

router.post("/login", async (req, res) => {
  const response = await login(req, res);
  if ('token' in response) {
    res.status(200).json(response);
  }
});

router.post("/register", async (req, res) => {
  await register(req, res);
});

export default router;
