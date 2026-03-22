const express = require("express");
const Faculty = require("../models/Faculty");
const { getFacultyProfile, getMonthlySummary } = require('../controllers/facultyController');

const router = express.Router();

// 🔓 PUBLIC ROUTE (No protect middleware)
router.get("/:facultyId", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      facultyId: req.params.facultyId,
    });

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json(faculty);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;