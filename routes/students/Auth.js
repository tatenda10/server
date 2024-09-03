const express = require('express');
const { changeStudentPassword  } = require('../../controllers/students/Auth');
const router = express.Router();


router.post('/student-change-password', changeStudentPassword);

module.exports = router;
