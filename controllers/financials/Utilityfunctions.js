const db = require('../../db/db');

// Utility function to fetch invoice
async function getInvoice(class_type, form, year, term) {
    const [invoice] = await db.query(`
        SELECT * FROM invoices 
        WHERE class_type = ? AND form = ? AND year = ? AND term = ?
    `, [class_type, form, year, term]);

    return invoice.length ? invoice[0] : null;
}

// Utility function to check if student has medical aid
async function checkStudentMedicalAid(reg_number) {
    const [student] = await db.query(`
        SELECT HasMedicalAid FROM students WHERE RegNumber = ?
    `, [reg_number]);

    return student.length ? student[0].HasMedicalAid : false;
}

// Utility function to fetch medical aid amount
async function getMedicalAidAmount() {
    const [medicalAid] = await db.query(`
        SELECT aid_amount FROM medical_aid ORDER BY created_at DESC LIMIT 1
    `);

    return medicalAid.length ? medicalAid[0].aid_amount : 0;
}

// Utility function to generate a unique payment reference
function generatePaymentReference() {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${randomString}`;
}

// Utility function to update student balance

async function updateStudentBalance(reg_number, class_type, form, year, term, reportedAmount, totalAmount) {
    try {
        console.log(`Starting balance update for student ${reg_number}`);

        // Ensure reportedAmount and totalAmount are treated as numbers
        reportedAmount = parseFloat(reportedAmount);
        totalAmount = parseFloat(totalAmount);

        // Fetch prior balances
        const [priorBalances] = await db.query(`
            SELECT * FROM balances WHERE reg_number = ? ORDER BY year ASC, term ASC
        `, [reg_number]);

        let remainingAmount = reportedAmount;
        let totalCredit = 0;

        // Log the initial reported amount
        console.log(`Initial reported amount: ${reportedAmount}`);

        // Apply CR balances from previous terms
        for (const priorBalance of priorBalances) {
            if (priorBalance.balance_type === 'CR') {
                totalCredit += parseFloat(priorBalance.balance);
                console.log(`Applying prior CR balance: ${priorBalance.balance}`);
                
                // Remove the prior CR balance from the database
                await db.query(`
                    DELETE FROM balances WHERE id = ?
                `, [priorBalance.id]);
            }
        }

        // Log total credit before applying it to the remaining amount
        console.log(`Total credit from previous terms: ${totalCredit}`);

        // Add any CR balance from previous terms to the current payment amount
        remainingAmount += totalCredit;

        // Log the combined amount before calculating the balance
        console.log(`Remaining amount after applying credits: ${remainingAmount}`);

        // Calculate the remaining balance for the current term
        let currentBalance = totalAmount - remainingAmount;
        console.log(`Calculated balance after applying payment: ${currentBalance}`);

        let balanceType = 'DR';

        if (currentBalance < 0) {
            // Overpayment results in a CR balance
            currentBalance = Math.abs(currentBalance);
            balanceType = 'CR';
            console.log(`Overpayment detected, new CR balance: ${currentBalance}`);
        } else if (currentBalance > 0) {
            // Underpayment results in a DR balance
            balanceType = 'DR';
            console.log(`Underpayment detected, new DR balance: ${currentBalance}`);
        } else {
            // Payment exactly matches the invoice
            currentBalance = 0;
            balanceType = 'DR';
            console.log(`Payment matches the invoice, balance is zero.`);
        }

        // Check if a balance already exists for the current term and if it is fully settled
        const existingCurrentBalance = priorBalances.find(b => b.year === year && b.term === term);

        if (existingCurrentBalance && existingCurrentBalance.balance_type === 'DR' && existingCurrentBalance.balance <= 0) {
            console.log(`No further payments are needed for this term. Invoice is fully paid.`);
            throw new Error('Invoice for this term is already fully paid.');
        }

        // Delete any existing records for the same reg_number to avoid duplication
        await db.query(`
            DELETE FROM balances WHERE reg_number = ?
        `, [reg_number]);

        // Update or insert the balance for the current term
        if (existingCurrentBalance) {
            await db.query(`
                UPDATE balances 
                SET balance = ?, balance_type = ?, class_type = ?, form = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [currentBalance, balanceType, class_type, form, existingCurrentBalance.id]);
        } else {
            await db.query(`
                INSERT INTO balances (reg_number, class_type, form, year, term, balance, balance_type, currency)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'USD')
            `, [reg_number, class_type, form, year, term, currentBalance, balanceType]);
        }

        console.log(`Final balance for student ${reg_number}: ${currentBalance} ${balanceType}`);

        return { balance: currentBalance, balanceType };
    } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
    }
}














// Utility function to poll Paynow payment status
async function pollPaymentStatus(pollUrl, paymentId) {
    try {
        const response = await fetch(pollUrl);
        const responseBody = await response.text();
        const params = new URLSearchParams(responseBody);
        const status = params.get('status');

        if (status === 'Paid') {
            console.log('Payment was successful!');
            await db.query(`UPDATE payments SET status = 'Paid' WHERE id = ?`, [paymentId]);
        } else {
            console.log('Payment status:', status);
            await db.query(`UPDATE payments SET status = ? WHERE id = ?`, [status, paymentId]);
        }
    } catch (error) {
        console.error('Error polling payment status:', error);
    }
}

// Utility function to generate Paynow reference
function generatePaynowReference() {
    const timestamp = new Date().getTime();
    const randomString = generateRandomString(7);
    return `PAYNOW-${timestamp}-${randomString}`;
}

function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    }
    return result;
}

// Utility function to fetch the latest exchange rate from ZIG to USD
// Utility function to fetch the latest exchange rate from USD to ZIG
async function getLatestExchangeRate() {
    const [rate] = await db.query(`
        SELECT usd_to_zig_rate FROM rates ORDER BY created_at DESC LIMIT 1
    `);
    return rate.length ? rate[0].usd_to_zig_rate : 1; // Default to 1 if no rate is found
}

// Utility function to calculate total payments made against an invoice
async function getTotalPayments(reg_number, class_type, form, year, term) {
    const [result] = await db.query(`
        SELECT SUM(reported_amount) AS total_paid FROM payments 
        WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?
    `, [reg_number, class_type, form, year, term]);
    
    return result[0].total_paid || 0;
}
async function checkZIGPaymentLimit(reg_number, class_type, form, year, term, reportedAmount, totalAmount, rtgsPercentage) {
    const allowedZIGAmount = (totalAmount * rtgsPercentage) / 100;
    const previousPayments = await getTotalPayments(reg_number, class_type, form, year, term);
    const totalPaid = previousPayments + reportedAmount;

    if (totalPaid > allowedZIGAmount) {
        throw new Error('ZIG payments exceed the allowed RTGS limit');
    }
}
module.exports = {
    getInvoice,
    checkStudentMedicalAid,
    getMedicalAidAmount,
    updateStudentBalance,
    pollPaymentStatus,
    generatePaynowReference,
    getLatestExchangeRate,
    generatePaymentReference,
    getTotalPayments,
    checkZIGPaymentLimit
};
