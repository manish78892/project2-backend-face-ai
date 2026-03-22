const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get attendance matrix for a date range
// @route   GET /api/admin/reports/attendance-range
// @query   start (YYYY-MM-DD), end (YYYY-MM-DD)
// @access  Private (Admin)
// @desc    Get attendance matrix for a date range
// @route   GET /api/admin/reports/attendance-range
// @query   start (YYYY-MM-DD), end (YYYY-MM-DD)
// @access  Private (Admin)
exports.getAttendanceRangeReport = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all faculty (without faceDescriptor)
    const faculty = await Faculty.find().select('-faceDescriptor').sort({ name: 1 });

    // Fetch attendance records in the range (populate facultyId to get name)
    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('facultyId', 'name');

    // Fetch approved leaves overlapping the range
    const leaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    }).populate('faculty', 'name facultyId');

    // Build list of dates
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      days.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    // Build a map of faculty leave days for quick lookup
    const leaveMap = new Map();
    leaves.forEach(leave => {
      if (!leave.faculty) return; // skip if faculty reference missing
      const facultyIdStr = leave.faculty._id.toString();
      const leaveDates = [];
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        leaveDates.push(dateStr);
      }
      leaveMap.set(facultyIdStr, new Set(leaveDates));
    });

    // Build the report matrix
    const matrix = faculty.map(f => {
      const facultyIdStr = f._id.toString();
      const row = {
        facultyId: f.facultyId,       // 👈 this is the string employee ID
        name: f.name,
        department: f.department,
        days: {}
      };
      days.forEach(date => {
        // Find attendance record for this faculty on this date
        const attendance = attendances.find(a => 
          a.facultyId && a.facultyId._id && a.facultyId._id.toString() === facultyIdStr && 
          a.date.toISOString().split('T')[0] === date
        );
        if (attendance) {
          row.days[date] = attendance.status;
        } else {
          // Check if on approved leave that day
          const onLeave = leaveMap.get(facultyIdStr)?.has(date) || false;
          row.days[date] = onLeave ? 'leave' : 'absent';
        }
      });
      return row;
    });

    res.json({
      start,
      end,
      days,
      matrix
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};