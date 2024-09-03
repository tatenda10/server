const express = require('express');
const router = express.Router();

const {
    correctPaymentRegNumber,
    editPaymentAmount,
    deletePayment,
    finalizeTempPayment,
} = require('../../controllers/financials/Editpayments');

// Route to correct a payment's reg_number
router.put('/payments/correct-reg-number', correctPaymentRegNumber);

// Route to edit a payment amount
router.put('/payments/edit-amount', editPaymentAmount);

// Route to delete a payment
router.delete('/payments/delete', deletePayment);

// Route to finalize a temp payment and move to payments table
router.post('/temp-payments/finalize', finalizeTempPayment);

module.exports = router;
