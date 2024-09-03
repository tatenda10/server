const express = require('express');
const router = express.Router();
const { resetClasses } = require('../../controllers/classes/ResetClasses'); // Adjust the path as needed

router.post('/', resetClasses);

module.exports = router;
