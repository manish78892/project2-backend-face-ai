const express = require('express');
const { getStats, getAttendanceLog } = require('../controllers/dashboardController');
const {protect} = require('../middleware/auth');
const router = express.Router();

// All dashboard routes are protected
router.use(protect);

router.get('/stats', getStats);
router.get('/attendance-log', getAttendanceLog);

module.exports = router;