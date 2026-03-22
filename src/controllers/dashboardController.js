const Leave = require('../models/Leave');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Helper to get start and end of current day
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Total faculty count
    const totalFaculty = await Faculty.countDocuments();

    // Attendance in the last 24 hours grouped by status
    const attendance = await Attendance.aggregate([
      { $match: { date: { $gte: last24h } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      present: 0,
      late: 0,
      onleave: 0
    };
    attendance.forEach(item => {
      if (counts.hasOwnProperty(item._id)) counts[item._id] = item.count;
    });

    res.json({
      totalFaculty,
      presentToday: counts.present,
      lateToday: counts.late,
      onLeaveToday: counts.onleave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get paginated attendance log
// @route   GET /api/admin/dashboard/attendance-log
// @query   page (default 1), limit (default 10), search (optional, by faculty name)
// @access  Private (Admin)
exports.getAttendanceLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build match stage for search (filter by faculty name)
    const matchStage = {};
    if (search) {
      // Search in faculty names – we need to join with Faculty collection first
      // We'll use $lookup and then $match on name
      // But aggregation can be heavy; alternatively, we can search faculty IDs first.
      // For simplicity, we'll implement search later if needed.
    }

    // Aggregation pipeline to get attendance with faculty details
    const pipeline = [
      {
        $lookup: {
          from: 'faculties', // name of the faculty collection
          localField: 'facultyId',
          foreignField: '_id',
          as: 'facultyInfo'
        }
      },
      { $unwind: '$facultyInfo' },
      {
        $match: search ? {
          'facultyInfo.name': { $regex: search, $options: 'i' }
        } : {}
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { date: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                facultyName: '$facultyInfo.name',
                facultyId: '$facultyInfo.facultyId',
                 department: '$facultyInfo.department',
                date: 1,
                status: 1,
                timeIn: { $dateToString: { format: '%H:%M', date: '$date', timezone: '+05:30' } },
                dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date',  } },
              }
            }
          ]
        }
      }
    ];

    const result = await Attendance.aggregate(pipeline);
    const total = result[0].metadata[0]?.total || 0;
    const records = result[0].data;

    res.json({
      records,
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
// @desc    Get dashboard statistics (total faculty, present today, on leave)
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Total faculty count
    const totalFaculty = await Faculty.countDocuments();

    // Attendance in the last 24 hours grouped by status
    const attendance = await Attendance.aggregate([
      { $match: { date: { $gte: last24h } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      present: 0,
      late: 0
    };
    attendance.forEach(item => {
      if (counts.hasOwnProperty(item._id)) counts[item._id] = item.count;
    });

    // Count faculty on approved leave where current date is within leave period
    const onLeave = await Leave.countDocuments({
      status: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    res.json({
      totalFaculty,
      presentToday: counts.present,
      lateToday: counts.late,
      onLeaveToday: onLeave,
      pendingLeaves
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};