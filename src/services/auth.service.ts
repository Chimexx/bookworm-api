import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/auth.utils";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  userName: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    userName: string;
    profileImage?: string;
  };
}

export const login = async (req: Request<{}, {}, LoginInput>, res: Response): Promise<Response | LoginResponse> => {
  try {
    const { password, email } = req.body;
    
    if (!password || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).json({ message: "Email or password is incorrect." });
    }

    const isUserValid = user && (await user.comparePassword(password));
  
    if (isUserValid) {
      const token = await generateToken(user);

      return {
        token,
        user: {
          id: user._id.toString(),
          email,
          userName: user.userName,
          profileImage: user.profileImage,
        },
      };
    } else {
      return res
        .status(400)
        .json({ message: "Email or password is incorrect." });
    }
    
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response): Promise<Response> => {
  try {
    const { userName, password, email } = req.body;

    if (!userName || !password || !email) {

      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const user = await User.create({
      userName,
      email,
      password,
    });

    const token = await generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email,
        userName,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error: " + (error as Error).message });
  }
};
