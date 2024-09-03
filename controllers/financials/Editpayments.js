const db = require('../../db/db');
require('dotenv').config();

const { 
   
    getInvoice, 
    checkStudentMedicalAid, 
    getMedicalAidAmount, 
} = require('./Utilityfunctions');

// Function to correct a payment's reg_number
const correctPaymentRegNumber = async (req, res) => {
    const { paymentId, correctRegNumber } = req.body;

    try {
        // Validate the new reg_number
        const [student] = await db.query(`SELECT * FROM students WHERE RegNumber = ?`, [correctRegNumber]);
        if (!student.length) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch the Original Payment Data
        const [originalPayment] = await db.query(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
        if (!originalPayment.length) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const payment = originalPayment[0];
        const oldRegNumber = payment.reg_number;

        // Update the Payment Record
        await db.query(`
            UPDATE payments 
            SET reg_number = ? 
            WHERE id = ?
        `, [correctRegNumber, paymentId]);

        // Update Related Balances for the New Reg Number
        const [existingBalance] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
        `, [correctRegNumber, payment.class_type, payment.form, payment.year, payment.term]);

        if (existingBalance.length) {
            const updatedBalance = parseFloat(existingBalance[0].balance) + parseFloat(payment.received_amount);
            await db.query(`
                UPDATE balances 
                SET balance = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
            `, [updatedBalance, correctRegNumber, payment.class_type, payment.form, payment.year, payment.term]);
        } else {
            await db.query(`
                INSERT INTO balances (reg_number, class_type, form, year, term, balance, balance_type, currency)
                VALUES (?, ?, ?, ?, ?, ?, 'DR', 'USD')
            `, [correctRegNumber, payment.class_type, payment.form, payment.year, payment.term, payment.received_amount]);
        }

        // Reverse the Balance Adjustment for the Old Reg Number
        const [oldBalance] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
        `, [oldRegNumber, payment.class_type, payment.form, payment.year, payment.term]);

        if (oldBalance.length) {
            let updatedOldBalance = parseFloat(oldBalance[0].balance) - parseFloat(payment.received_amount);

            // Check if the updated balance is negative
            if (updatedOldBalance < 0) {
                updatedOldBalance = Math.abs(updatedOldBalance); // Remove the negative sign
                await db.query(`
                    UPDATE balances 
                    SET balance = ?, balance_type = 'DR', updated_at = CURRENT_TIMESTAMP 
                    WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
                `, [updatedOldBalance, oldRegNumber, payment.class_type, payment.form, payment.year, payment.term]);
            } else if (updatedOldBalance === 0) {
                await db.query(`DELETE FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?`, 
                [oldRegNumber, payment.class_type, payment.form, payment.year, payment.term]);
            } else {
                await db.query(`
                    UPDATE balances 
                    SET balance = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
                `, [updatedOldBalance, oldRegNumber, payment.class_type, payment.form, payment.year, payment.term]);
            }
        }

        return res.status(200).json({ message: 'Payment reg_number corrected successfully' });

    } catch (error) {
        console.error('Error correcting payment reg_number:', error);
        return res.status(500).json({ message: 'Failed to correct payment reg_number' });
    }
};


// Function to edit payment amount
const editPaymentAmount = async (req, res) => {
    const { paymentId, newAmount, newCurrency } = req.body;

    try {
        const [payment] = await db.query(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
        if (!payment.length) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const oldReportedAmount = parseFloat(payment[0].reported_amount);
        const oldCurrency = payment[0].currency;
        let reportedAmount = parseFloat(newAmount);

        // Convert ZIG to USD if the new currency is ZIG
        if (newCurrency === 'ZIG') {
            const [rateResult] = await db.query(`SELECT usd_to_zig_rate FROM rates ORDER BY created_at DESC LIMIT 1`);
            if (!rateResult.length) {
                return res.status(500).json({ message: 'Exchange rate not found' });
            }
            const exchangeRate = parseFloat(rateResult[0].usd_to_zig_rate);
            reportedAmount = parseFloat(newAmount) / exchangeRate;
        }

        const difference = reportedAmount - oldReportedAmount;

        // Update the payment with the actual received amount and the converted reported amount in USD
        await db.query(`
            UPDATE payments 
            SET received_amount = ?, reported_amount = ?, currency = ?, created_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [newAmount, reportedAmount, newCurrency || oldCurrency, paymentId]);

        const [balance] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ? AND currency = 'USD'
        `, [payment[0].reg_number, payment[0].class_type, payment[0].form, payment[0].year, payment[0].term]);

        if (balance.length) {
            let newBalance;

            if (balance[0].balance_type === 'CR') {
                newBalance = parseFloat(balance[0].balance) + difference;
                if (newBalance < 0) {
                    newBalance = Math.abs(newBalance);
                    balanceType = 'DR';
                } else {
                    balanceType = 'CR';
                }
            } else if (balance[0].balance_type === 'DR') {
                newBalance = parseFloat(balance[0].balance) - difference;
                if (newBalance < 0) {
                    newBalance = Math.abs(newBalance);
                    balanceType = 'CR';
                } else {
                    balanceType = 'DR';
                }
            }

            // Update the balance with the new value in USD
            await db.query(`
                UPDATE balances 
                SET balance = ?, balance_type = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
            `, [newBalance, balanceType, payment[0].reg_number, payment[0].class_type, payment[0].form, payment[0].year, payment[0].term]);
        }

        return res.status(200).json({ message: 'Payment amount and currency updated successfully' });
    } catch (error) {
        console.error('Error updating payment amount and currency:', error);
        return res.status(500).json({ message: 'Failed to update payment amount and currency' });
    }
};






// Function to delete a payment
const deletePayment = async (req, res) => {
    const { paymentId } = req.body;

    try {
        // Fetch the payment details to be deleted
        const [payment] = await db.query(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
        if (!payment.length) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const reportedAmount = parseFloat(payment[0].reported_amount);
        const regNumber = payment[0].reg_number;
        const classType = payment[0].class_type;
        const form = payment[0].form;
        const year = payment[0].year;
        const term = payment[0].term;

        // Fetch the related balance for the payment
        const [balance] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ? AND currency = 'USD'
        `, [regNumber, classType, form, year, term]);

        if (balance.length) {
            let newBalance;

            // Adjust the balance based on the balance type and the payment amount
            if (balance[0].balance_type === 'CR') {
                newBalance = parseFloat(balance[0].balance) - reportedAmount;
                if (newBalance < 0) {
                    newBalance = Math.abs(newBalance);
                    balanceType = 'DR';
                } else {
                    balanceType = 'CR';
                }
            } else if (balance[0].balance_type === 'DR') {
                newBalance = parseFloat(balance[0].balance) + reportedAmount;
                if (newBalance < 0) {
                    newBalance = Math.abs(newBalance);
                    balanceType = 'CR';
                } else {
                    balanceType = 'DR';
                }
            }

            // Update or delete the balance entry based on the new balance value
            if (newBalance === 0) {
                await db.query(`
                    DELETE FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
                `, [regNumber, classType, form, year, term]);
            } else {
                await db.query(`
                    UPDATE balances 
                    SET balance = ?, balance_type = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
                `, [newBalance, balanceType, regNumber, classType, form, year, term]);
            }
        }

        // Finally, delete the payment record
        await db.query(`DELETE FROM payments WHERE id = ?`, [paymentId]);

        return res.status(200).json({ message: 'Payment deleted successfully and balance updated' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return res.status(500).json({ message: 'Failed to delete payment' });
    }
};


// Function to move a temp payment to the payments table and update balance
const updateStudentBalance = async (reg_number, class_type, form, year, term, reportedAmount) => {
    try {
        const [invoice] = await db.query(`
            SELECT total_amount FROM invoices 
            WHERE class_type = ? AND form = ? AND year = ? AND term = ?
        `, [class_type, form, year, term]);

        if (!invoice.length) {
            throw new Error('Invoice not found');
        }

        let invoiceTotal = parseFloat(invoice[0].total_amount);

        // Fetch prior balance
        const [priorBalance] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
        `, [reg_number, class_type, form, year, term]);

        let remainingAmount = reportedAmount;
        let totalCredit = 0;

        // If prior balance exists, apply any CR balances and update balance
        if (priorBalance.length && priorBalance[0].balance_type === 'CR') {
            totalCredit = parseFloat(priorBalance[0].balance);
            remainingAmount += totalCredit;

            // Remove the prior CR balance from the database
            await db.query(`
                DELETE FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
            `, [reg_number, class_type, form, year, term]);
        }

        // Calculate the remaining balance for the current term
        let currentBalance = invoiceTotal - remainingAmount;
        let balanceType = 'DR';

        if (currentBalance < 0) {
            currentBalance = Math.abs(currentBalance);
            balanceType = 'CR';
        } else if (currentBalance === 0) {
            balanceType = 'DR';
        }

        // Update or insert the balance for the current term
        await db.query(`
            INSERT INTO balances (reg_number, class_type, form, year, term, balance, balance_type, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'USD')
            ON DUPLICATE KEY UPDATE balance = ?, balance_type = ?, updated_at = CURRENT_TIMESTAMP
        `, [reg_number, class_type, form, year, term, currentBalance, balanceType, currentBalance, balanceType]);

        console.log(`Final balance for student ${reg_number}: ${currentBalance} ${balanceType}`);
    } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
    }
};

// Function to move a temp payment to the payments table and update balance
const finalizeTempPayment = async (req, res) => {
    const { tempPaymentId, sourceTable } = req.body;
    const table = sourceTable === 'temp_payments2' ? 'temp_payments2' : 'temp_payments';

    try {
        // Fetch the temporary payment details
        const [tempPayment] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [tempPaymentId]);
        if (!tempPayment.length) {
            return res.status(404).json({ message: 'Temp payment not found' });
        }

        const payment = tempPayment[0];

        // Move the payment from temp_payments to payments with status as 'Paid'
        await db.query(`
            INSERT INTO payments (reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference, status, created_at)
            SELECT reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference, 'Paid', NOW()
            FROM ${table} WHERE id = ?
            ON DUPLICATE KEY UPDATE received_amount = VALUES(received_amount), reported_amount = VALUES(reported_amount), status = 'Paid', created_at = NOW()
        `, [tempPaymentId]);

        // Update the student balance using the correct parameters
        await updateStudentBalance(
            payment.reg_number,
            payment.class_type,
            payment.form,
            payment.year,
            payment.term,
            payment.reported_amount
        );

        // Remove the payment from temp_payments
        await db.query(`DELETE FROM ${table} WHERE id = ?`, [tempPaymentId]);

        return res.status(200).json({ message: 'Temp payment finalized successfully and status updated to Paid' });
    } catch (error) {
        console.error('Error finalizing temp payment:', error);
        return res.status(500).json({ message: 'Failed to finalize temp payment' });
    }
};


module.exports = {
    correctPaymentRegNumber,
    editPaymentAmount,
    deletePayment,
    finalizeTempPayment,
};
