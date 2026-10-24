import mongoose from "mongoose";

const perkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Perk", perkSchema);
