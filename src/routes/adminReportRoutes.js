const express = require('express');
const { getAttendanceRangeReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/attendance-range', getAttendanceRangeReport);

module.exports = router;