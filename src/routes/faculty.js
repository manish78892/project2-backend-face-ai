const express = require('express');
const {
  addFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All routes are protected – require valid admin token
router.use(protect);

// Routes for /api/admin/faculty
router.route('/')
  .get(getAllFaculty)    // GET all faculty (with pagination/search)
  .post(addFaculty);     // POST add new faculty

// Routes for /api/admin/faculty/:id
router.route('/:id')
  .get(getFacultyById)   // GET single faculty by ID
  .put(updateFaculty)    // PUT update faculty
  .delete(deleteFaculty); // DELETE faculty

module.exports = router;