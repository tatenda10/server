const express = require('express');
const router = express.Router();
const { getSingleSubjectLevelClass ,addSubjectClass, editSubjectClass, deleteSubjectClass } = require('../../controllers/classes/Subjectlevelclasses');

// Route to add a new subject class
router.post('/', async (req, res) => {
    const subjectClassData = req.body;
    
    try {
        const classId = await addSubjectClass(subjectClassData);
        res.status(201).json({ message: 'Subject class added successfully', classId });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Error adding subject class' });
    }
});

// Route to edit an existing subject class
router.put('/:classId', async (req, res) => {
    const classId = req.params.classId;
    const subjectClassData = req.body;
    
    try {
        const affectedRows = await editSubjectClass(classId, subjectClassData);
        if (affectedRows === 0) {
            res.status(404).json({ error: 'Subject class not found' });
        } else {
            res.status(200).json({ message: 'Subject class updated successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating subject class' });
    }
});


router.delete('/:classId', async (req, res) => {
    const classId = req.params.classId;
    
    try {
        const affectedRows = await deleteSubjectClass(classId);
        if (affectedRows === 0) {
            res.status(404).json({ error: 'Subject class not found' });
        } else {
            res.status(200).json({ message: 'Subject class deleted successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error deleting subject class' });
    }
});

router.get('/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        const classData = await getSingleSubjectLevelClass(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json(classData);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving class' });
    }
});

module.exports = router;
