import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Attendance from "./models/Attendance.js";
import Perk from "./models/Perk.js";
import CampusEvent from "./models/CampusEvent.js";
import Announcement from "./models/Announcement.js";
import Lecture from "./models/Lecture.js";
import Feedback from "./models/Feedback.js";

await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sih_erp");
try {
  await Promise.all([User.deleteMany({}), Attendance.deleteMany({}), Perk.deleteMany({}), CampusEvent.deleteMany({}), Announcement.deleteMany({}), Lecture.deleteMany({}), Feedback.deleteMany({})]);
  const pass = await bcrypt.hash("student123", 12);
  const [student1, student2, student3, faculty, admin] = await User.create([
    { username:"student", passwordHash:pass, fullName:"Aarav Sharma", role:"STUDENT" },
    { username:"riya", passwordHash:pass, fullName:"Riya Verma", role:"STUDENT" },
    { username:"kabir", passwordHash:pass, fullName:"Kabir Singh", role:"STUDENT" },
    { username:"faculty", passwordHash:await bcrypt.hash("faculty123",12), fullName:"Dr. Meera Singh", role:"FACULTY" },
    { username:"admin", passwordHash:await bcrypt.hash("admin123",12), fullName:"Campus Administrator", role:"ADMIN" }
  ]);
  await Attendance.insertMany([
    {student:student1._id,studentName:student1.fullName,subject:"Machine Learning",attended:18,totalClasses:22},
    {student:student2._id,studentName:student2.fullName,subject:"Machine Learning",attended:14,totalClasses:22},
    {student:student3._id,studentName:student3.fullName,subject:"Machine Learning",attended:20,totalClasses:22}
  ]);
  await Perk.insertMany([
    {title:"Coursera Campus Learning",category:"Learning",description:"Explore curated courses in AI, cloud, cybersecurity, and software engineering. Demo benefit; confirm eligibility with the placement cell."},
    {title:"Innovation Lab Access",category:"Campus",description:"Book supervised lab time for prototypes, hackathon preparation, and interdisciplinary projects."},
    {title:"Career Launch Support",category:"Career",description:"Attend resume clinics, mock technical interviews, and placement-readiness workshops."}
  ]);
  await CampusEvent.insertMany([
    {title:"SIH Prototype Review Day",eventDate:"2026-11-12",description:"Present your problem statement, prototype, validation results, and next steps to faculty mentors. Demo event."},
    {title:"AI & Data Science Workshop",eventDate:"2026-11-18",description:"Hands-on sessions covering model evaluation, responsible AI, and deployment basics. Demo event."},
    {title:"Placement Preparation Clinic",eventDate:"2026-11-24",description:"Practice resume walkthroughs, DSA explanations, and project demos with peer feedback. Demo event."}
  ]);
  await Announcement.insertMany([
    {title:"SIH Prototype Review — submissions open",message:"Student teams should prepare a 3-minute problem statement, working demo, architecture diagram, and evidence of testing. Submit your team details to your faculty mentor by 5 PM on 7 November. This is sample showcase content.",audience:"STUDENT",createdBy:admin._id},
    {title:"Placement readiness clinic registration",message:"Register for a mock interview slot and bring your latest one-page resume. Sessions cover project explanation, Java fundamentals, SQL, and DSA. Sample notice for the demo portal.",audience:"ALL",createdBy:admin._id},
    {title:"Faculty coordination — ML attendance and feedback",message:"Please update Machine Learning attendance after each lecture and review pending student feedback before the weekly department meeting. Sample faculty notice.",audience:"FACULTY",createdBy:admin._id}
  ]);
  await Lecture.insertMany([
    {subject:"Machine Learning",facultyName:faculty.fullName,day:"Monday",startTime:"09:00",endTime:"10:00",room:"Block A · 204"},
    {subject:"Machine Learning",facultyName:faculty.fullName,day:"Wednesday",startTime:"11:00",endTime:"12:00",room:"Block A · 204"},
    {subject:"Machine Learning",facultyName:faculty.fullName,day:"Friday",startTime:"10:00",endTime:"11:00",room:"AI Lab · 302"}
  ]);
  await Feedback.insertMany([
    {student:student1._id,studentName:student1.fullName,subject:"Machine Learning lab",message:"Could we have one additional hands-on session on model evaluation and confusion matrices?",status:"NEW"},
    {student:student2._id,studentName:student2.fullName,subject:"Lecture materials",message:"Sharing slides before the lecture would help us prepare questions in advance.",status:"NEW"},
    {student:student3._id,studentName:student3.fullName,subject:"Project guidance",message:"A short project checkpoint every two weeks would help us validate our approach.",status:"REVIEWED"}
  ]);
  console.log("Demo seed complete.");
  console.log("Student: student / student123 | Riya: riya / student123 | Kabir: kabir / student123");
  console.log("Faculty: faculty / faculty123 | Admin: admin / admin123");
} finally { await mongoose.disconnect(); }
