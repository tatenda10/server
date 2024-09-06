const express = require('express');
const router = express.Router();
const { updateBalance } = require('../../controllers/financials/UpdateBalance');

// Update balance endpoint
router.put('/balances/update', updateBalance);

module.exports = router;
