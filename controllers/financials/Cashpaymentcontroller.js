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

        // Check if the student is in the new_students table
        const [newStudent] = await db.query(`
            SELECT * FROM new_students WHERE reg_number = ?
        `, [reg_number]);

        let registrationAmount = 0;
        if (newStudent.length > 0) {
            // Fetch the registration fees for the student's form
            const formRange = newStudent[0].form <= 4 ? 'Form 1-4' : 'Form 5-6';
            const [registrationFees] = await db.query(`
                SELECT amount FROM registrations WHERE form_range = ?
            `, [formRange]);

            if (registrationFees.length > 0) {
                registrationAmount = parseInt(registrationFees[0].amount, 10); // Convert the fetched amount to an integer
                console.log(`Registration amount for ${formRange} (as integer): ${registrationAmount}`);
            } else {
                console.log(`No registration amount found for ${formRange}`);
            }
        }

        // Fetch the invoice for the specified term
        const invoice = await getInvoice(class_type, form, year, term);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Ensure the invoice total is treated as a float to avoid string concatenation
        invoice.total_amount = parseFloat(invoice.total_amount);

        // Check if the term is already fully paid before proceeding
        const [existingBalance] = await db.query(`
            SELECT balance, balance_type FROM balances 
            WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
        `, [reg_number, class_type, form, year, term]);

        if (existingBalance.length > 0) {
            const { balance, balance_type } = existingBalance[0];
            if (balance >= 0 && balance_type === 'CR') {
                return res.status(400).json({ message: 'Fees for this term are already paid in full. No further payment is needed.' });
            }
        }

        // Check if the student has medical aid and add the amount to the invoice total if applicable
        const hasMedicalAid = await checkStudentMedicalAid(reg_number);
        if (hasMedicalAid) {
            const medicalAidAmount = await getMedicalAidAmount();
            invoice.total_amount += parseFloat(medicalAidAmount); // Ensure the medical aid amount is added as a number
        }

        // Add the registration fee for new students (in integer format)
        if (registrationAmount > 0) {
            invoice.total_amount += registrationAmount; // Correctly add as an integer to float
            console.log(`Invoice total after adding registration fee (integer): ${invoice.total_amount}`);
        }

        let reportedAmount = amount_paid;

        // If the payment is in ZIG, convert the amount_paid to USD and check limits
        if (currency === 'ZIG') {
            const exchangeRate = await getLatestExchangeRate();
            reportedAmount = amount_paid / exchangeRate; // Convert ZIG to USD
            console.log(`Converted amount from ZIG to USD: ${reportedAmount}`);

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
        //
        // Delete the student from new_students table after successful payment
        if (newStudent.length > 0) {
            await db.query(`DELETE FROM new_students WHERE reg_number = ?`, [reg_number]);
        }

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
