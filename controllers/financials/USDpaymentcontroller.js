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
const paynowIntegrationIdUSD = process.env.PAYNOW_INTEGRATION_ID_USD;
const paynowIntegrationKeyUSD = process.env.PAYNOW_INTEGRATION_KEY_USD;
const paynowemail = process.env.PAYNOW_EMAIL;

const paynowUSD = new Paynow(paynowIntegrationIdUSD, paynowIntegrationKeyUSD);
paynowUSD.resultUrl = 'http://example.com/gateways/paynow/update';
paynowUSD.returnUrl = 'http://localhost:3000/Cart';

// Function to handle Paynow USD payments
const createPaynowUSDPayment = async (req, res) => {
    const { reg_number, class_type, form, year, term, amount_paid } = req.body;

    try {
        const invoice = await getInvoice(class_type, form, year, term);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const hasMedicalAid = await checkStudentMedicalAid(reg_number);

        if (hasMedicalAid) {
            const medicalAidAmount = await getMedicalAidAmount();
            // Update invoice total to include medical aid amount
            invoice.total_amount += medicalAidAmount;
        }

        // Create Paynow payment
        const payment = paynowUSD.createPayment(generatePaynowReference(), paynowemail);
        payment.add('Invoice Payment', amount_paid);

        const paynowResponse = await paynowUSD.send(payment);

        if (paynowResponse.success) {
            const [paymentResult] = await db.query(`
                INSERT INTO payments (reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', 'PaynowUSD', ?)
            `, [reg_number, class_type, form, year, term, amount_paid, amount_paid, paynowResponse.pollUrl]);

            const paymentId = paymentResult.insertId;

            await pollPaymentStatus(paynowResponse.pollUrl, paymentId);
            return res.status(200).json({ redirectLink: paynowResponse.redirectUrl, pollUrl: paynowResponse.pollUrl });
        } else {
            return res.status(500).json({ error: paynowResponse.error });
        }
    } catch (error) {
        console.error('Error processing Paynow USD payment:', error);
        res.status(500).json({ message: 'Failed to process payment' });
    }
};

module.exports = {
    createPaynowUSDPayment,
};
