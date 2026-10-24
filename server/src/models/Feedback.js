import mongoose from "mongoose";
const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  status: { type: String, enum: ["NEW", "REVIEWED"], default: "NEW" }
}, { timestamps: true });
export default mongoose.model("Feedback", feedbackSchema);
