import jwt from "jsonwebtoken";
import { IUser } from "../models/User.js";

interface TokenPayload {
  userName: IUser["userName"];
  _id: IUser["_id"];
}

export const generateToken = async ({ userName, _id }: TokenPayload): Promise<string> => {
  const secretOrPrivateKey = process.env.JWT_SECRET;
  
  if (!secretOrPrivateKey) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    {
      userName,
      userId: _id,
    },
    secretOrPrivateKey,
    { expiresIn: "7d" }
  );
};
