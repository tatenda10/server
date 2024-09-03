const express = require('express');
const router = express.Router();
const { addPaperMarksAndCalculateTotal } = require('../../controllers/results/Results');

// Route to add paper marks and calculate total for a subject result
router.post('/', async (req, res) => {
    const subjectResultData = req.body.subjectResultData;
    const paperMarks = req.body.paperMarks;

    try {
        const result = await addPaperMarksAndCalculateTotal(subjectResultData, paperMarks);
        res.status(201).json({ message: 'Subject result added and total calculated successfully', result });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Error adding subject result and calculating total' });
    }
});



module.exports = router;
