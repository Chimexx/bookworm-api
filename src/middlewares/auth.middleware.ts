import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { NextFunction, Request, Response } from "express";

export const authGuard = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, Access denied." });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    const userId = decodedData.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Token invalid, Access denied." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return res
      .status(401)
      .json({ message: "Unauthorized: " + (error as Error).message });
  }
};
