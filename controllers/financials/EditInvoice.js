const db = require('../../db/db');

// Function to edit the invoice and update associated balances
const editInvoice = async (req, res) => {
    try {
        const { invoiceId, newTotalAmount, classType, form, year, term, items } = req.body;
         console.log(req.body)
        // Validation: Check if all required inputs are provided
        if (!invoiceId || !newTotalAmount || !classType || !form || !year || !term || !items || !items.length) {
            return res.status(400).json({ message: 'All fields are required.' });
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
            SET total_amount = ?, class_type = ?, form = ?, year = ?, term = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [newTotalAmount, classType, form, year, term, invoiceId]);

        // Step 3: Remove all existing items for this invoice
        await db.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);

        // Step 4: Insert new items into the invoice_items table
        for (let item of items) {
            await db.query(`
                INSERT INTO invoice_items (invoice_id, item_name, item_amount) 
                VALUES (?, ?, ?)
            `, [invoiceId, item.name, item.amount]);
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

module.exports = {
    editInvoice,
};

const deleteInvoice = async (req, res) => {
    const { invoiceId, classType, form, year, term } = req.body;

    // Validation: Check if all required inputs are provided
    if (!invoiceId || !classType || !form || !year || !term) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Step 1: Fetch the original invoice
        const [originalInvoice] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
        if (!originalInvoice.length) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const oldTotalAmount = parseFloat(originalInvoice[0].total_amount);

        // Step 2: Delete the invoice and its items
        await db.query(`DELETE FROM invoices WHERE id = ?`, [invoiceId]);
        await db.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);

        // Step 3: Fetch all students who have made payments related to this invoice
        const [payments] = await db.query(`
            SELECT DISTINCT reg_number FROM payments 
            WHERE class_type = ? AND form = ? AND year = ? AND term = ?
        `, [classType, form, year, term]);

        // Step 4: Update the balances of students who have paid towards this invoice
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
                    newBalance = parseFloat(balance[0].balance) - oldTotalAmount;
                    if (newBalance < 0) {
                        newBalance = Math.abs(newBalance);
                        balanceType = 'DR';
                    } else {
                        balanceType = 'CR';
                    }
                } else if (balance[0].balance_type === 'DR') {
                    newBalance = parseFloat(balance[0].balance) + oldTotalAmount;
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

        return res.status(200).json({ message: 'Invoice and associated balances deleted successfully.' });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        return res.status(500).json({ message: 'Failed to delete invoice and associated balances.' });
    }
};

module.exports = {
    editInvoice,
    deleteInvoice,
};
