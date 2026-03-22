const Leave = require('../models/Leave');
const Faculty = require('../models/Faculty');

// @desc    Faculty applies for leave
// @route   POST /api/leaves/apply
// @access  Private (Faculty)
exports.applyLeave = async (req, res) => {
  const { facultyId, type, startDate, endDate, reason } = req.body;
  try {
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const leave = new Leave({
      faculty: facultyId,
      type,
      startDate,
      endDate,
      reason
    });
    await leave.save();
    res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get faculty's own leaves (for faculty dashboard)
// @route   GET /api/leaves/my-leaves/:facultyId
// @access  Private (Faculty)
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ faculty: req.params.facultyId }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all pending leaves (for admin)
// @route   GET /api/admin/leaves/pending
// @access  Private (Admin)
exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'pending' })
      .populate('faculty', 'name facultyId department')
      .sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve or reject leave (admin)
// @route   PUT /api/admin/leaves/:leaveId
// @access  Private (Admin)
exports.updateLeaveStatus = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const leave = await Leave.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    leave.reviewedBy = req.user.id; // from auth middleware
    leave.reviewedAt = new Date();
    await leave.save();
    res.json({ message: `Leave ${status}`, leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// @desc    Delete a leave request (only if pending and owned by faculty)
// @route   DELETE /api/leaves/:leaveId
exports.deleteLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { facultyId } = req.body; // optional, to verify ownership

  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // Optional: verify the faculty owns this leave
    if (facultyId && leave.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Admin delete a leave request (any pending)
// @route   DELETE /api/admin/leaves/:leaveId
exports.deleteLeaveAdmin = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // Optionally restrict to pending only
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending requests' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};