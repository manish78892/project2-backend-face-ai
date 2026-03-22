const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance,
  getAttendanceByDate,
  getFacultyAttendance,
  updateAttendance,
  getAttendanceReport,
} = require('../controllers/attendanceController');
// ✅ Public route for faculty to mark their own attendance (no token needed)
router.post('/', markAttendance);

// All other routes require authentication
router.use(protect);

// Admin only routes
router.get('/date/:date', authorize('admin'), getAttendanceByDate);
router.get('/report', authorize('admin'), getAttendanceReport);
router.put('/:id', authorize('admin'), updateAttendance);

// Faculty can view their own attendance (accessible with any valid token)
router.get('/faculty/:facultyId', getFacultyAttendance);

module.exports = router;