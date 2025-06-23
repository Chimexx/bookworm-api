import { Request } from "express";
import { IUser } from "../models/User.js";

export interface BookInput {
  title: string;
  description: string;
  rating?: number;
  image: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}