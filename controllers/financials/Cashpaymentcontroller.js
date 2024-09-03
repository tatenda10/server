const db = require('../../db/db');
const { 
    getInvoice, 
    checkStudentMedicalAid, 
    getMedicalAidAmount, 
    updateStudentBalance, 
    getLatestExchangeRate,
    generatePaymentReference,
    checkZIGPaymentLimit
} = require('./Utilityfunctions');

// Function to handle cash payments
const createCashPayment = async (req, res) => {
    const { reg_number, class_type, form, year, term, amount_paid, currency, payment_reference } = req.body;

    try {
        // Verify that the registration number exists in the students table
        const [student] = await db.query(`
            SELECT * FROM students WHERE RegNumber = ?
        `, [reg_number]);

        if (student.length === 0) {
            return res.status(400).json({ message: 'The student registration number did not match any records. Please check the registration number and try again.' });
        }

        // Fetch the invoice for the specified term
        const invoice = await getInvoice(class_type, form, year, term);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Check if the term is already fully paid before proceeding
        const [existingBalance] = await db.query(`
            SELECT balance, balance_type FROM balances 
            WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
        `, [reg_number, class_type, form, year, term]);

        if (existingBalance.length > 0) {
            const { balance, balance_type } = existingBalance[0];
            if (balance => 0 && balance_type === 'CR') {
                return res.status(400).json({ message: 'Fees for this term is already paid in full. No further payment is needed.' });
            }
        }

        // Check if the student has medical aid and add the amount to the invoice total if applicable
        const hasMedicalAid = await checkStudentMedicalAid(reg_number);
        if (hasMedicalAid) {
            const medicalAidAmount = await getMedicalAidAmount();
            invoice.total_amount += medicalAidAmount;
        }

        let reportedAmount = amount_paid;

        // If the payment is in ZIG, convert to USD and check limits
        if (currency === 'ZIG') {
            const exchangeRate = await getLatestExchangeRate();
            reportedAmount = amount_paid / exchangeRate; // Convert ZIG to USD

            // Check if ZIG payments exceed the allowed limit
            const exceeded = await checkZIGPaymentLimit(reg_number, class_type, form, year, term, reportedAmount, invoice.total_amount, invoice.rtgs_percentage);
            if (exceeded) {
                return res.status(200).json({ message: 'ZIG payment exceeds the allowed RTGS limit. Please reduce the amount or pay in USD.' });
            }
        }

        // Use the provided payment reference or generate a new one if not provided
        const finalPaymentReference = payment_reference || generatePaymentReference();

        // Update student balance using the utility function
        const balanceUpdateResult = await updateStudentBalance(reg_number, class_type, form, year, term, reportedAmount, invoice.total_amount);

        // Handle the case where the term is already fully paid
        if (balanceUpdateResult.message) {
            return res.status(400).json(balanceUpdateResult);
        }

        // Create payment record with status 'Paid'
        const [paymentResult] = await db.query(`
            INSERT INTO payments (reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Cash', ?, 'Paid')
        `, [reg_number, class_type, form, year, term, amount_paid, reportedAmount, currency, finalPaymentReference]);

        const paymentId = paymentResult.insertId;

        res.status(201).json({ 
            message: 'Cash payment successful', 
            paymentId, 
            paymentReference: finalPaymentReference, 
            updatedBalance: {
                balance: balanceUpdateResult.balance, 
                balanceType: balanceUpdateResult.balanceType 
            } 
        });
    } catch (error) {
        console.error('Error processing cash payment:', error);
        res.status(500).json({ message: error.message || 'Failed to process payment' });
    }
};

module.exports = {
    createCashPayment,
};
