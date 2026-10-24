import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!username || !password) return res.status(400).json({ message: "Username and password are required." });
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role } });
  } catch (error) { next(error); }
});


router.post("/signup", async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "STUDENT").toUpperCase();
    if (!fullName || !username || password.length < 8) return res.status(400).json({ message: "Enter your name, username, and a password of at least 8 characters." });
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return res.status(400).json({ message: "Username must be 3–30 characters: letters, numbers, dots, underscores, or hyphens." });
    if (!["STUDENT", "FACULTY", "ADMIN"].includes(role)) return res.status(400).json({ message: "Choose a valid demo role." });
    const user = await User.create({ fullName, username, passwordHash: await bcrypt.hash(password, 12), role });
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.status(201).json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role } });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username, fullName: req.user.fullName, role: req.user.role } });
});

export default router;
