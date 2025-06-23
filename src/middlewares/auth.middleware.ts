import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { NextFunction, Request, Response } from "express";

export const authGuard = async (req:any, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "")
    
    if (!token) {
      return res.status(401).json({ message: "User not authenticated, Access denied." });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET as string)
    const userId = (decodedData as any).userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Token invalid, Access denied." });
    }

    req.user = user;
    next()
    
  } catch (error) {
    
  }
};