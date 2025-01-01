import express from "express";
const { signup } = require("../controllers/userController");

const router = express();

router.post("/signup", signup);

module.exports = router;
