// routes/facultyDashboard.js
const express = require('express');
const { getFacultyDashboard } = require('../controllers/facultyController');
const router = express.Router();

// GET /api/faculty/dashboard/:facultyId
router.get('/dashboard/:facultyId', getFacultyDashboard);

module.exports = router;