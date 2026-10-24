import mongoose from "mongoose";

const campusEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  eventDate: { type: String, required: true },
  description: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model("CampusEvent", campusEventSchema);
