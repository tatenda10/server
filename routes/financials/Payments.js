const express = require('express');
const router = express.Router();

const { createCashPayment } = require('../../controllers/financials/cashPaymentController');
const { createPaynowZIGPayment } = require('../../controllers/financials/ZIGpaymentcontroller');
const { createPaynowUSDPayment } = require('../../controllers/financials/USDpaymentcontroller');


const { getAllPayments } = require('../../controllers/financials/Getpayments');
const { searchPayments } = require('../../controllers/financials/Searchpayments');

const { searchStudentRecords,
    getStudentRecord } = require('../../controllers/financials/StudentRecords');

// Route for Cash Payment
router.post('/cash', createCashPayment);

// Route for Paynow ZIG Payment
router.post('/paynow-zig', createPaynowZIGPayment);

// Route for Paynow USD Payment
router.post('/paynow-usd', createPaynowUSDPayment);


router.get('/payments', getAllPayments);

// Route for Paynow USD Payment
router.get('/payments/search', searchPayments);


router.get('/student/:reg_number', getStudentRecord);

// Search transactions for a specific student
router.get('/student/:reg_number/search-transactions', searchStudentRecords);

module.exports = router;
