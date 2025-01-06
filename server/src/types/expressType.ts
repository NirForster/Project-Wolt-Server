import { Request } from "express";

export interface RequestWithUserID extends Request {
  userID?: string;
}
