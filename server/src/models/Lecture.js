import mongoose from "mongoose";
const lectureSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  facultyName: { type: String, required: true, trim: true },
  day: { type: String, required: true, trim: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true }
}, { timestamps: true });
export default mongoose.model("Lecture", lectureSchema);
