// routes/students/students.js
const express = require('express');
const router = express.Router();


const { addStudentWithGuardianAndBalance } = require('../../controllers/students/students.js');
const { deleteStudent } =  require('../../controllers/students/students.js');
const { editStudentWithGuardian } = require('../../controllers/students/Editstudent');



router.post('/', addStudentWithGuardianAndBalance);
router.put('/delete-student/:regnumber', deleteStudent);
router.put('/students/:regNumber', editStudentWithGuardian);


module.exports = router;
