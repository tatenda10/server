const db = require('../../db/db');
const { Paynow } = require('paynow');
const fetch = require('node-fetch');
require('dotenv').config();

const { 
    getInvoice, 
    checkStudentMedicalAid, 
    getMedicalAidAmount, 
    updateStudentBalance, 
    generatePaynowReference 
} = require('./Utilityfunctions');

const paynowIntegrationIdZIG = process.env.PAYNOW_INTEGRATION_ID_ZIG;
const paynowIntegrationKeyZIG = process.env.PAYNOW_INTEGRATION_KEY_ZIG;
const paynowemail = process.env.PAYNOW_EMAIL;

const paynowZIG = new Paynow(paynowIntegrationIdZIG, paynowIntegrationKeyZIG);
paynowZIG.resultUrl = 'http://example.com/gateways/paynow/update';
paynowZIG.returnUrl = 'http://localhost:3000/Cart';

// Function to handle Paynow ZIG payments
const createPaynowZIGPayment = async (req, res) => {
    const { reg_number, class_type, form, year, term, amount_paid, ecocashNumber } = req.body;

    try {
        // Step 1: Verify that the student exists and check if they are new
        const [student] = await db.query(`
            SELECT * FROM students WHERE RegNumber = ?
        `, [reg_number]);

        if (!student) {
            return res.status(400).json({ message: 'The student registration number did not match any records.' });
        }

        // Step 2: Check if the student is in the new_students table
        const [newStudent] = await db.query(`
            SELECT * FROM new_students WHERE reg_number = ?
        `, [reg_number]);

        let registrationAmount = 0;
        if (newStudent.length > 0) {
            // Step 3: Fetch registration fee based on the form range
            const formRange = newStudent[0].form <= 4 ? 'Form 1-4' : 'Form 5-6';
            const [registrationFees] = await db.query(`
                SELECT amount FROM registrations WHERE form_range = ?
            `, [formRange]);

            if (registrationFees.length > 0) {
                registrationAmount = parseInt(registrationFees[0].amount, 10);
            } else {
                console.log(`No registration amount found for ${formRange}`);
            }
        }

        // Step 4: Fetch the invoice
        const invoice = await getInvoice(class_type, form, year, term);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Step 5: Check if the student has medical aid
        const hasMedicalAid = await checkStudentMedicalAid(reg_number);

        if (hasMedicalAid) {
            const medicalAidAmount = await getMedicalAidAmount();
            // Add medical aid to invoice total
            invoice.total_amount += medicalAidAmount;
        }

        // Step 6: Add registration fee for new students (if applicable)
        if (registrationAmount > 0) {
            invoice.total_amount += registrationAmount;
            console.log(`Invoice total after adding registration fee: ${invoice.total_amount}`);
        }

        // Step 7: Fetch the current ZIG to USD exchange rate
        const [rate] = await db.query(`SELECT zig_to_usd_rate FROM rates ORDER BY created_at DESC LIMIT 1`);
        const reportedAmount = amount_paid / rate[0].zig_to_usd_rate;

        // Step 8: Check if the reported amount exceeds the allowed RTGS payment percentage
        if (reportedAmount > invoice.total_amount * (invoice.rtgs_percentage / 100)) {
            return res.status(400).json({ message: 'Exceeded allowed RTGS payment amount' });
        }

        // Step 9: Create Paynow ZIG payment
        const payment = paynowZIG.createPayment(generatePaynowReference(), paynowemail);
        payment.add('Invoice Payment', reportedAmount);

        const paynowResponse = await paynowZIG.sendMobile(payment, ecocashNumber, 'ecocash');

        if (paynowResponse.success) {
            // Step 10: Record the payment in the payments table
            const [paymentResult] = await db.query(`
                INSERT INTO payments (reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ZIG', 'PaynowZIG', ?)
            `, [reg_number, class_type, form, year, term, amount_paid, reportedAmount, paynowResponse.pollUrl]);

            const paymentId = paymentResult.insertId;

            // Step 11: Poll Paynow status
            await pollPaymentStatus(paynowResponse.pollUrl, paymentId);

            // Step 12: If the student was new, remove them from the new_students table
            if (newStudent.length > 0) {
                await db.query(`DELETE FROM new_students WHERE reg_number = ?`, [reg_number]);
            }

            return res.status(200).json({ redirectLink: paynowResponse.redirectUrl, pollUrl: paynowResponse.pollUrl });
        } else {
            return res.status(500).json({ error: paynowResponse.error });
        }
    } catch (error) {
        console.error('Error processing Paynow ZIG payment:', error);
        res.status(500).json({ message: 'Failed to process payment' });
    }
};

module.exports = {
    createPaynowZIGPayment,
};
