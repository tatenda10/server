const db = require('../../db/db'); // Ensure correct path to db

// Create Invoice
const createInvoice = async (req, res) => {
    const { classType, form, term, year, rtgsPercentage, items } = req.body;
  
    try {
        const [existingInvoice] = await db.query(
            `SELECT id FROM invoices WHERE class_type = ? AND form = ? AND term = ? AND year = ?`,
            [classType, form, term, year]
        );

        if (existingInvoice.length > 0) {
            return res.status(400).json({ message: 'An invoice for this class type, form, year, and term already exists. You can edit it instead.' });
        }

        const [result] = await db.query(
            `INSERT INTO invoices (class_type, form, term, year, rtgs_percentage, total_amount) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [classType, form, term, year, rtgsPercentage, 0] // total_amount is set to 0 initially
        );

        const invoiceId = result.insertId; // Ensure this correctly gets the ID of the inserted invoice
        let totalAmount = 0;

        for (let item of items) {
            const itemAmount = parseInt(item.amount, 10); // Convert amount to integer
            // Insert each item associated with the invoice
            await db.query(
                `INSERT INTO invoice_items (invoice_id, item_name, amount) VALUES (?, ?, ?)`,
                [invoiceId, item.name, itemAmount]
            );
            totalAmount += itemAmount; // Add the item amount to totalAmount
        }

        // Update the total amount in the invoice
        await db.query(
            `UPDATE invoices SET total_amount = ? WHERE id = ?`,
            [totalAmount, invoiceId]
        );

        res.status(201).json({ message: 'Invoice created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

// Edit Invoice
const editInvoice = async (req, res) => {
    try {
        // Extract the class_type from the request body and assign it to classType
        const {
            invoiceId,
            newTotalAmount,
            class_type, // Incoming from frontend
            form,
            year,
            term,
            items
        } = req.body;
        console.log(req.body)
        const classType = class_type; // Assigning class_type to classType

        // Validation: Check if all required inputs are provided
        const missingFields = [];
        if (!invoiceId) missingFields.push('invoiceId');
        if (!newTotalAmount) missingFields.push('newTotalAmount');
        if (!classType) missingFields.push('classType');
        if (!form) missingFields.push('form');
        if (!year) missingFields.push('year');
        if (!term) missingFields.push('term');
        if (!items || !items.length) missingFields.push('items');

        if (missingFields.length > 0) {
            console.error(`Validation error: Missing required fields - ${missingFields.join(', ')}`);
            return res.status(400).json({ message: 'All fields are required.', missingFields });
        }

        // Step 1: Fetch the original invoice
        const [originalInvoice] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
        if (!originalInvoice.length) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const oldTotalAmount = parseFloat(originalInvoice[0].total_amount);
        const difference = parseFloat(newTotalAmount) - oldTotalAmount;

        // Step 2: Update the invoice total amount and other fields
        await db.query(`
            UPDATE invoices 
            SET total_amount = ?, class_type = ?, form = ?, year = ?, term = ?, created_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [newTotalAmount, classType, form, year, term, invoiceId]);

        // Step 3: Remove all existing items for this invoice
        await db.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);

        // Step 4: Insert new items into the invoice_items table
        for (let item of items) {
            await db.query(`
                INSERT INTO invoice_items (invoice_id, item_name, amount) 
                VALUES (?, ?, ?)
            `, [invoiceId, item.item_name, item.amount]);
        }

        // Step 5: Fetch all students who have made payments related to this invoice
        const [payments] = await db.query(`
            SELECT DISTINCT reg_number FROM payments 
            WHERE class_type = ? AND form = ? AND year = ? AND term = ?
        `, [classType, form, year, term]);

        // Step 6: Update the balances of students who have paid towards this invoice
        for (let payment of payments) {
            const regNumber = payment.reg_number;

            // Fetch the current balance for the student
            const [balance] = await db.query(`
                SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
            `, [regNumber, classType, form, year, term]);

            if (balance.length) {
                let newBalance;
                let balanceType;

                if (balance[0].balance_type === 'CR') {
                    newBalance = parseFloat(balance[0].balance) - difference;
                    if (newBalance < 0) {
                        newBalance = Math.abs(newBalance);
                        balanceType = 'DR';
                    } else {
                        balanceType = 'CR';
                    }
                } else if (balance[0].balance_type === 'DR') {
                    newBalance = parseFloat(balance[0].balance) + difference;
                    if (newBalance < 0) {
                        newBalance = Math.abs(newBalance);
                        balanceType = 'CR';
                    } else {
                        balanceType = 'DR';
                    }
                }

                // Update the balance
                await db.query(`
                    UPDATE balances 
                    SET balance = ?, balance_type = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
                `, [newBalance, balanceType, regNumber, classType, form, year, term]);
            }
        }

        return res.status(200).json({ message: 'Invoice and associated balances updated successfully.' });

    } catch (error) {
        console.error('Error updating invoice:', error);
        return res.status(500).json({ message: 'Failed to update invoice and associated balances.' });
    }
};





// Delete Invoice
const deleteInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(`DELETE FROM invoices WHERE id = ?`, [id]);
        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
};

// Get Invoices
const getInvoices = async (req, res) => {
    try {
        // Get all invoices
        const [invoices] = await db.query(`SELECT * FROM invoices`);

        // For each invoice, get the associated items
        for (let invoice of invoices) {
            const [items] = await db.query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [invoice.id]);
            invoice.items = items; // Attach items to the invoice
        }

        res.status(200).json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve invoices' });
    }
};

const getInvoiceById = async (req, res) => {
    const { id } = req.params;

    try {
        // Get the invoice
        const [invoiceResult] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [id]);

        if (invoiceResult.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invoiceResult[0];

        // Get the items associated with the invoice
        const [itemsResult] = await db.query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [id]);

        invoice.items = itemsResult;

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Failed to fetch invoice:', error);
        res.status(500).json({ message: 'Failed to fetch invoice' });
    }
};


module.exports = {
    createInvoice,
    editInvoice,
    deleteInvoice,
    getInvoices,
    getInvoiceById
};
