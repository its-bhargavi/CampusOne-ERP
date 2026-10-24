import { Router } from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import Attendance from "../models/Attendance.js";
import Perk from "../models/Perk.js";
import CampusEvent from "../models/CampusEvent.js";
import Announcement from "../models/Announcement.js";
import Lecture from "../models/Lecture.js";
import Feedback from "../models/Feedback.js";
import { answerQuestion } from "../services/chatService.js";

const router = Router();
router.use(requireAuth);

async function attendanceFor(user) {
  const filter = ["FACULTY", "ADMIN"].includes(user.role) ? {} : { student: user._id };
  const records = await Attendance.find(filter).sort({ studentName: 1, subject: 1 }).lean();
  return records.map(r => ({ ...r, percentage: r.totalClasses ? Math.round(r.attended / r.totalClasses * 1000) / 10 : 0 }));
}
function visibleAnnouncements(user) {
  return Announcement.find(user.role === "ADMIN" ? {} : { audience: { $in: ["ALL", user.role] } })
    .populate("createdBy", "fullName role").sort({ createdAt: -1 }).lean();
}

router.get("/dashboard", async (req, res, next) => {
  try {
    const [attendance, perks, events, announcements, lectures, feedback] = await Promise.all([
      attendanceFor(req.user),
      Perk.find({ active: true }).sort({ createdAt: -1 }).lean(),
      CampusEvent.find().sort({ eventDate: 1 }).lean(),
      visibleAnnouncements(req.user),
      Lecture.find().sort({ day: 1, startTime: 1 }).lean(),
      req.user.role === "STUDENT"
        ? Feedback.find({ student: req.user._id }).sort({ createdAt: -1 }).lean()
        : Feedback.find().populate("student", "fullName username").sort({ createdAt: -1 }).lean()
    ]);
    res.json({
      user: { id: req.user._id, username: req.user.username, fullName: req.user.fullName, role: req.user.role },
      attendance, perks, events, announcements, lectures, feedback
    });
  } catch (error) { next(error); }
});

router.get("/attendance", async (req, res, next) => {
  try { res.json(await attendanceFor(req.user)); } catch (error) { next(error); }
});
router.post("/attendance", allowRoles("FACULTY", "ADMIN"), async (req, res, next) => {
  try {
    const { id, action } = req.body;
    let update;
    if (id && ["PRESENT", "ABSENT"].includes(action)) {
      const current = await Attendance.findById(id);
      if (!current) return res.status(404).json({ message: "Attendance record not found." });
      update = { attended: current.attended + (action === "PRESENT" ? 1 : 0), totalClasses: current.totalClasses + 1 };
    } else {
      const attended = Number(req.body.attended), totalClasses = Number(req.body.totalClasses);
      if (!id || !Number.isInteger(attended) || !Number.isInteger(totalClasses) || totalClasses < 1 || attended < 0 || attended > totalClasses)
        return res.status(400).json({ message: "Provide a valid record id, attended count, and total classes." });
      update = { attended, totalClasses };
    }
    const record = await Attendance.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: "Attendance record not found." });
    res.json({ message: "Attendance updated.", record });
  } catch (error) { next(error); }
});

router.post("/perks", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    if (![title, category, description].every(v => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "Title, category, and description are required." });
    const perk = await Perk.create({ title: title.trim(), category: category.trim(), description: description.trim() });
    res.status(201).json({ message: "Perk added.", perk });
  } catch (error) { next(error); }
});
router.post("/events", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const { title, eventDate, description } = req.body;
    if (![title, eventDate, description].every(v => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "Title, date, and description are required." });
    const event = await CampusEvent.create({ title: title.trim(), eventDate: eventDate.trim(), description: description.trim() });
    res.status(201).json({ message: "Event added.", event });
  } catch (error) { next(error); }
});
router.post("/announcements", allowRoles("FACULTY", "ADMIN"), async (req, res, next) => {
  try {
    const { title, message, audience = "ALL" } = req.body;
    if (![title, message].every(v => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "Title and announcement message are required." });
    if (!["ALL", "STUDENT", "FACULTY"].includes(audience))
      return res.status(400).json({ message: "Invalid audience." });
    const announcement = await Announcement.create({ title: title.trim(), message: message.trim(), audience, createdBy: req.user._id });
    res.status(201).json({ message: "Announcement published.", announcement });
  } catch (error) { next(error); }
});
router.post("/lectures", allowRoles("FACULTY", "ADMIN"), async (req, res, next) => {
  try {
    const { subject, day, startTime, endTime, room } = req.body;
    if (![subject, day, startTime, endTime, room].every(v => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "Complete all lecture schedule fields." });
    const lecture = await Lecture.create({ subject: subject.trim(), facultyName: req.user.fullName, day: day.trim(), startTime: startTime.trim(), endTime: endTime.trim(), room: room.trim() });
    res.status(201).json({ message: "Lecture scheduled.", lecture });
  } catch (error) { next(error); }
});
router.post("/feedback", allowRoles("STUDENT"), async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (![subject, message].every(v => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "Subject and feedback are required." });
    const feedback = await Feedback.create({ student: req.user._id, studentName: req.user.fullName, subject: subject.trim(), message: message.trim() });
    res.status(201).json({ message: "Feedback submitted.", feedback });
  } catch (error) { next(error); }
});
router.patch("/feedback/:id", allowRoles("FACULTY", "ADMIN"), async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status: "REVIEWED" }, { new: true });
    if (!feedback) return res.status(404).json({ message: "Feedback not found." });
    res.json({ message: "Feedback marked as reviewed.", feedback });
  } catch (error) { next(error); }
});


router.delete("/perks/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try { const item = await Perk.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({message:"Perk not found."}); res.json({message:"Perk deleted."}); } catch (error) { next(error); }
});
router.delete("/events/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try { const item = await CampusEvent.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({message:"Event not found."}); res.json({message:"Event deleted."}); } catch (error) { next(error); }
});
router.delete("/announcements/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try { const item = await Announcement.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({message:"Announcement not found."}); res.json({message:"Announcement deleted."}); } catch (error) { next(error); }
});
router.delete("/lectures/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try { const item = await Lecture.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({message:"Lecture not found."}); res.json({message:"Lecture deleted."}); } catch (error) { next(error); }
});

router.post("/chat", async (req, res, next) => {
  try {
    const question = String(req.body.message || "").trim();
    if (!question) return res.status(400).json({ message: "Enter a message." });
    if (question.length > 1500) return res.status(400).json({ message: "Message is too long (maximum 1500 characters)." });
    const [attendance, perks, events, announcements, lectures, feedback] = await Promise.all([
      attendanceFor(req.user), Perk.find({ active: true }).lean(), CampusEvent.find().lean(),
      visibleAnnouncements(req.user), Lecture.find().lean(),
      req.user.role === "STUDENT" ? Feedback.find({ student: req.user._id }).lean() : Feedback.find().lean()
    ]);
    const result = await answerQuestion(question, { user: req.user, attendance, perks, events, announcements, lectures, feedback });
    res.json(result);
  } catch (error) { next(error); }
});
export default router;
