import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { getUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/:id", verifyToken, getUser);

export default router;
