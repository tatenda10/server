const express = require('express');
const router = express.Router();
const { editInvoice, deleteInvoice } = require('../../controllers/financials/EditInvoice');

// Route to edit an invoice and update balances
router.put('/invoices/edit', editInvoice);

// Route to delete an invoice and update balances
router.delete('/invoices/delete', deleteInvoice);

module.exports = router;
