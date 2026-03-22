const express = require('express');
const { getPendingLeaves, updateLeaveStatus, deleteLeaveAdmin } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/pending', getPendingLeaves);
router.put('/:leaveId', updateLeaveStatus);
router.delete('/:leaveId', deleteLeaveAdmin);

module.exports = router;