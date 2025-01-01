const User = require("../models/User-model");
const bcrypt = require("bcrypt");

import { Request, Response } from "express";

const signup = async (req: Request, res: Response) => {
  const { email, password, phone };
  res.send("hello");
};

module.exports = {
  signup,
};
