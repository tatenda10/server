const express = require('express');
const router = express.Router();


const { searchStudents } = require('../../controllers/students/searchStudent.js');



router.get('/:searchTerm', async (req, res) => {
    const { searchTerm } = req.params;
    try {
      const results = await searchStudents(searchTerm);
      res.json(results);
    } catch (err) {
        console.log(err)
      res.status(500).json({ error: 'Failed to search students' });
  } })

  module.exports = router;