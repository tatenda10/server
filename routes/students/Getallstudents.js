const express = require('express');
const router = express.Router();
const { getAllStudents, getCachedStudentsCount } = require('../../controllers/students/Getallstudents');

router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [students, total] = await Promise.all([
            getAllStudents(limit, offset),
            getCachedStudentsCount()
        ]);

        res.json({
            total,
            students,
            limit,
            offset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving students' });
    }
});

module.exports = router;
