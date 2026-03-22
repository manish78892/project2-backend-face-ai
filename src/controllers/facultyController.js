const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');

// @desc    Add a new faculty member
// @route   POST /api/admin/faculty
// @access  Private (Admin only)
exports.addFaculty = async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const facultyId = (req.body.employeeId || req.body.facultyId || '').trim();
    const { name, email, department, phone, faceDescriptor } = req.body;

    if (!facultyId) {
      return res.status(400).json({ message: 'Faculty ID is required' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!department) {
      return res.status(400).json({ message: 'Department is required' });
    }
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ message: 'Valid face descriptor is required' });
    }

    const existing = await Faculty.findOne({
      $or: [{ facultyId }, { email }]
    });
    if (existing) {
      return res.status(400).json({
        message: existing.facultyId === facultyId
          ? 'Faculty ID already exists'
          : 'Email already exists'
      });
    }

    const faculty = new Faculty({
      facultyId,
      name,
      email,
      department,
      phone: phone || '',
      faceDescriptor
    });

    await faculty.save();
    res.status(201).json({
      message: 'Faculty registered successfully',
      faculty: {
        id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department
      }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error: Faculty ID or Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all faculty (with pagination/search)
// @route   GET /api/admin/faculty
// @access  Private (Admin)
exports.getAllFaculty = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Faculty.countDocuments(filter);
    const faculty = await Faculty.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('-faceDescriptor');

    res.json({
      faculty,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single faculty by ID
// @route   GET /api/admin/faculty/:id
// @access  Private (Admin)
exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).select('-faceDescriptor');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update faculty details
// @route   PUT /api/admin/faculty/:id
// @access  Private (Admin)
exports.updateFaculty = async (req, res) => {
  try {
    const { facultyId, email } = req.body;

    if (facultyId) {
      const existingId = await Faculty.findOne({ facultyId, _id: { $ne: req.params.id } });
      if (existingId) {
        return res.status(400).json({ message: 'Faculty ID already in use' });
      }
    }
    if (email) {
      const existingEmail = await Faculty.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-faceDescriptor');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({ message: 'Faculty updated successfully', faculty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete faculty
// @route   DELETE /api/admin/faculty/:id
// @access  Private (Admin)
exports.deleteFaculty = async (req, res) => {
  console.log('Deleting faculty with ID:', req.params.id);
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await Attendance.deleteMany({ faculty: req.params.id });

    res.json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard/:facultyId
// @access  Public
exports.getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const recentAttendance = await Attendance.find({ facultyId })
      .sort({ date: -1 })
      .limit(5);

    const recentActivity = recentAttendance.map(att => {
      const dateObj = new Date(att.date);
      const dateStr = dateObj.toLocaleDateString('en-IN', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
      const timeStr = att.checkIn 
        ? dateObj.toLocaleTimeString('en-IN', { 
            hour: '2-digit', minute: '2-digit', hour12: true 
          })
        : 'N/A';
      return {
        date: dateStr,
        timeIn: timeStr,
        status: att.status === 'present' ? 'Present' : 
                att.status === 'late' ? 'Late' : 'Absent'
      };
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const totalPresent = await Attendance.countDocuments({
      facultyId,
      status: 'present',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const stats = {
      totalPresent,
      workingHours: "0h",
      punctuality: "0%",
      overtime: "0h"
    };

    res.json({
      profile: {
        name: faculty.name,
        department: faculty.department
      },
      stats,
      recentActivity
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get faculty profile by ID
// @route   GET /api/faculty/profile/:id
// @access  Public
exports.getFacultyProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({
      name: faculty.name,
      department: faculty.department,
      email: faculty.email,
      phone: faculty.phone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFacultyByIdPublic = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty); // includes faceDescriptor
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

