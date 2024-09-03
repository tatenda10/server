const db = require('../../db/db');
const { Paynow } = require('paynow');
const fetch = require('node-fetch');
require('dotenv').config();

const { 
    getInvoice, 
    checkStudentMedicalAid, 
    getMedicalAidAmount, 
    updateStudentBalance 
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
        const invoice = await getInvoice(class_type, form, year, term);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const hasMedicalAid = await checkStudentMedicalAid(reg_number);

        if (hasMedicalAid) {
            const medicalAidAmount = await getMedicalAidAmount();
            // Update invoice total to include medical aid amount
            invoice.total_amount += medicalAidAmount;
        }

        const [rate] = await db.query(`SELECT zig_to_usd_rate FROM rates ORDER BY created_at DESC LIMIT 1`);
        const reportedAmount = amount_paid / rate[0].zig_to_usd_rate;

        if (reportedAmount > invoice.total_amount * (invoice.rtgs_percentage / 100)) {
            return res.status(400).json({ message: 'Exceeded allowed RTGS payment amount' });
        }

        // Create Paynow payment
        const payment = paynowZIG.createPayment(generatePaynowReference(), paynowemail);
        payment.add('Invoice Payment', reportedAmount);

        const paynowResponse = await paynowZIG.sendMobile(payment, ecocashNumber, 'ecocash');

        if (paynowResponse.success) {
            const [paymentResult] = await db.query(`
                INSERT INTO payments (reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ZIG', 'PaynowZIG', ?)
            `, [reg_number, class_type, form, year, term, amount_paid, reportedAmount, paynowResponse.pollUrl]);

            const paymentId = paymentResult.insertId;

            await pollPaymentStatus(paynowResponse.pollUrl, paymentId);
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
