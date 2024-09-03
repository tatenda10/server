const express = require('express');
const router = express.Router();
const { publishResults } = require('../../controllers/results/Publishresults'); // Adjust the path to your controller

// Route to publish/unpublish results
router.post('/', publishResults);

module.exports = router;
