const express = require('express');
const router = express.Router();
const { getAllTempPayments } = require('../../controllers/financials/Gettemppayments');
const { searchTempPayments } = require('../../controllers/financials/Searchtemppayments');
const { getPaymentById } = require('../../controllers/financials/Getpaymentid');

// Route to get all temp payments from both temp_payments and temp_payments2
router.get('/temp-payments', getAllTempPayments);
router.get('/search', searchTempPayments);
router.get('/payments/:id', getPaymentById);

module.exports = router;
