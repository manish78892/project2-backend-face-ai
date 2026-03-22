const express = require('express');
const { verifyFacultyId } = require('../controllers/facultyAuthController');
const { getFacultyProfile } = require('../controllers/facultyController');
const { getFacultyByIdPublic } = require('../controllers/facultyController');
const router = express.Router();
router.get('/profile/:id', getFacultyProfile);
router.post('/verify', verifyFacultyId);
router.get('/:id', getFacultyByIdPublic);

module.exports = router;