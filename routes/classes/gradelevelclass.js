const express = require('express');
const router = express.Router();
const { 
    addGradeLevelClass, 
    getAllGradeLevelClasses, 
    editGradeLevelClass, 
    deleteClass, 
    getSubjectsOfClass,
    getSingleGradeLevelClass 
} = require('../../controllers/classes/Gradelevelclasses');

// Route to add a new grade level class
router.post('/', async (req, res) => {
    const classData = req.body;
    try {
        const classId = await addGradeLevelClass(classData);
        res.json({ message: 'Grade level class added successfully', classId });
    } catch (err) {
        res.status(500).json({ error: 'Error adding grade level class' });
    }
});

// Route to get all grade level classes
router.get('/', async (req, res) => {
    try {
        const classes = await getAllGradeLevelClasses();
        res.json({ classes });
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving grade level classes' });
    }
});

// Route to get a single grade level class by ID
router.get('/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        const classData = await getSingleGradeLevelClass(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json(classData);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving class' });
    }
});


router.get('/subjects/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        const subjects = await getSubjectsOfClass(classId);
        res.json(subjects);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Error retrieving subjects for class' });
    }
});

// Route to update a grade level class by ID
router.put('/:id', async (req, res) => {
    const classId = req.params.id;
    const classData = req.body;
    
    try {
        const affectedRows = await editGradeLevelClass(classId, classData);
        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json({ message: 'Class updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating class' });
    }
});

// Route to delete a grade level class by ID
router.delete('/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        const result = await deleteClass(classId);
        res.status(200).json({ message: 'Class deleted successfully', affectedRows: result });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting class' });
    }
});

module.exports = router;
