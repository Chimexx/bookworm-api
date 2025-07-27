import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  userName: string;
  email: string;
  password: string;
  profileImage?: string;
  createdAt?: Date;
  comparePassword: (candidatePassword: string)=> Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  profileImage: {
    type: String,
    default: "",
  },
},
{ timestamps: true }
);

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(4);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
