const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true,
    default: 'present',
  },
  notes: {
    type: String,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, //true
  },
}, {
  timestamps: true,
});

// Ensure one attendance record per faculty per day
attendanceSchema.index({ facultyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);