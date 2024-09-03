const express = require('express');
const router = express.Router();
const {
    createInvoice,
    editInvoice,
    deleteInvoice,
    getInvoices,
    getInvoiceById  // New function for getting invoices
} = require('../../controllers/financials/Invoices');

// Route for creating an invoice
router.post('/', createInvoice);

// Route for editing an invoice
router.put('/:id', editInvoice);

// Route for deleting an invoice
router.delete('/:id', deleteInvoice);

// Route for getting all invoices
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

module.exports = router;
