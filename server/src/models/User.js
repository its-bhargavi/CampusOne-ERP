import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, enum: ["STUDENT", "FACULTY", "ADMIN"], required: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
