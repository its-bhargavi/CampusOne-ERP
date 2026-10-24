import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import erpRoutes from "./routes/erp.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sih_erp";

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET. Copy server/.env.example to server/.env and configure it.");
  process.exit(1);
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "SIH ERP API" }));
app.use("/api/auth", authRoutes);
app.use("/api", erpRoutes);

app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: "A record with that value already exists." });
  res.status(500).json({ message: "Server error. Check the backend terminal." });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`SIH ERP API running at http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
