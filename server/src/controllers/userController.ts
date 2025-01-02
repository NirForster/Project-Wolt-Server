import User from "../models/User-model";
const bcrypt = require("bcrypt");

import { Request, Response } from "express";

const signup = async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;

  try {
    console.log("------------------------------------------------");
    const newUser = await User.create({ email, password, name, phone });
    console.log("------------------------------------------------");

    console.log(newUser);

    res.send(newUser);
  } catch (err) {
    console.log(err);

    res.status(400).send("bad");
  }
};

module.exports = {
  signup,
};
