import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";

export interface IBook extends Document {
  title: string;
  description: string;
  rating?: number;
  image: string;
  user: IUser["_id"];
}

const bookSchema = new Schema<IBook>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  image: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
},
{ timestamps: true }
);

export const Book = mongoose.model<IBook>("Book", bookSchema);
