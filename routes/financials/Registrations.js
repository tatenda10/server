const express = require('express');
const router = express.Router();
const { getRegistrationAmounts, updateRegistrationAmount } = require('../../controllers/financials/Registrations');

// Route to get the registration amounts
router.get('/', getRegistrationAmounts);

// Route to update the registration amount
router.put('/', updateRegistrationAmount);

module.exports = router;
