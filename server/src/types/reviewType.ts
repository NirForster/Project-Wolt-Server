import { Types } from "mongoose";

export default interface Review {
  user: Types.ObjectId;
  rating: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  comment?: string;
  createdAt?: Date;
}
