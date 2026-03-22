const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true }, // e.g., "KCP-2026-04"
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  phone: { type: String },
  // Face descriptor – an array of numbers (e.g., 128‑dimensional embedding)
  faceDescriptor: { type: [Number], required: true },
  // You can add more fields like address if needed
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);