import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  subject: { type: String, required: true, trim: true },
  attended: { type: Number, required: true, min: 0 },
  totalClasses: { type: Number, required: true, min: 1 }
}, { timestamps: true });

attendanceSchema.virtual("percentage").get(function () {
  return this.totalClasses ? Math.round((this.attended / this.totalClasses) * 1000) / 10 : 0;
});
attendanceSchema.set("toJSON", { virtuals: true });
attendanceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Attendance", attendanceSchema);
