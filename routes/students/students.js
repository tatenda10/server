const express = require('express');
const router = express.Router();

const { addStudentWithGuardianAndBalance, deleteStudent } = require('../../controllers/students/Students.js');
const { editStudentWithGuardian } = require('../../controllers/students/Editstudent');
const { addNewStudent, deleteNewStudent,getNewStudents } = require('../../controllers/students/Students.js');  // Import the new controller functions

// Existing student routes
router.post('/', addStudentWithGuardianAndBalance);
router.put('/delete-student/:regnumber', deleteStudent);
router.put('/students/:regNumber', editStudentWithGuardian);

// New students routes
router.post('/new-student', addNewStudent);  // Route for adding a new student to New_students
router.delete('/new-student/:regNumber', deleteNewStudent);  // Route for deleting a new student from New_students
router.get('/new-students', getNewStudents);

module.exports = router;
