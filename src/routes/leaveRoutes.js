const express = require('express');
const { applyLeave, getMyLeaves, deleteLeave } = require('../controllers/leaveController');
const router = express.Router();

router.post('/apply', applyLeave);
router.get('/my-leaves/:facultyId', getMyLeaves);
router.delete('/:leaveId', deleteLeave);

module.exports = router;