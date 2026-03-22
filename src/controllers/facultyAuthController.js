const Faculty = require('../models/Faculty');

// @desc    Verify faculty ID exists
// @route   POST /api/faculty/verify
// @access  Public
exports.verifyFacultyId = async (req, res) => {
  const { facultyId } = req.body;
  try {
    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty ID not found' });
    }
    // Return basic info (no token needed)
    res.json({
      success: true,
      faculty: {
        id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        department: faculty.department
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};