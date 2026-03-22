const Attendance = require('../models/Attendance');
const Faculty = require('../models/Faculty');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
  try {
    const { facultyId, date, checkIn, checkOut, status, notes } = req.body;

      // Normalize date to whole day
    const targetDate = new Date(date);
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      facultyId,
      date: { $gte: start, $lte: end }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this faculty on this date' 
      });
    }

     const attendanceData = {
      facultyId,
      date: targetDate,
      checkIn: targetDate,
      checkOut:  targetDate,
      status,
      notes
    };

    // If an admin is authenticated, record who marked it
    if (req.user) {
      attendanceData.markedBy = req.user.id;
    }

     const attendance = await Attendance.create(attendanceData);

    res.status(201).json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Private
const getAttendanceByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: date, $lte: endDate },
    }).populate({
      path: 'facultyId',
      populate: { path: 'userId', select: 'name email' }
    });

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get faculty attendance
// @route   GET /api/attendance/faculty/:facultyId
// @access  Private
const getFacultyAttendance = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { facultyId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .sort('-date')
      .populate('markedBy', 'name');

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error('Get faculty attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private/Admin
const updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance not found' });
    }

    attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get attendance report
// @route   GET /api/attendance/report
// @access  Private/Admin
const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all faculty in department
    const facultyQuery = department ? { department } : {};
    const faculty = await Faculty.find(facultyQuery).populate('userId', 'name email');

    // Get attendance for the month
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate report
    const report = faculty.map(f => {
      const facultyAttendance = attendance.filter(a => 
        a.facultyId.toString() === f._id.toString()
      );
      
      const present = facultyAttendance.filter(a => a.status === 'present').length;
      const absent = facultyAttendance.filter(a => a.status === 'absent').length;
      const late = facultyAttendance.filter(a => a.status === 'late').length;
      const halfDay = facultyAttendance.filter(a => a.status === 'half-day').length;

      return {
        facultyId: f._id,
        name: f.userId.name,
        employeeId: f.employeeId,
        department: f.department,
        designation: f.designation,
        stats: {
          present,
          absent,
          late,
          halfDay,
          total: present + absent + late + halfDay,
        },
        attendance: facultyAttendance,
      };
    });

    res.json({
      success: true,
      month,
      year,
      department: department || 'all',
      report,
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getFacultyAttendance,
  updateAttendance,
  getAttendanceReport,
};