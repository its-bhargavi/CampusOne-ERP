import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Please sign in first." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id username fullName role");
    if (!user) return res.status(401).json({ message: "Account not found." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired or token invalid. Please sign in again." });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Your role cannot perform this action." });
    }
    next();
  };
}
