const express = require('express');
const { getFinancials, getStudentStats, getLatestAnnouncement, getEmployeeStats } = require('../../controllers/Utilities/dashboardController');

const router = express.Router();

router.get('/financials', getFinancials);
router.get('/students', getStudentStats);
router.get('/announcement', getLatestAnnouncement);
router.get('/employees', getEmployeeStats);

module.exports = router;
