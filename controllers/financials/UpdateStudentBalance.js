const db = require('../../db/db');

// Controller to update or alter the student balance
const updateStudentBalance = async (req, res) => {
    const { regNumber, classType, form, year, term, newBalance, balanceType } = req.body;

    try {
        const [existingBalance] = await db.query(
            `SELECT * FROM balances WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?`,
            [regNumber, classType, form, year, term]
        );

        if (existingBalance.length) {
            await db.query(
                `UPDATE balances SET balance = ?, balance_type = ?, updated_at = CURRENT_TIMESTAMP WHERE reg_number = ? AND class_type = ? AND form = ? AND year = ? AND term = ?`,
                [newBalance, balanceType, regNumber, classType, form, year, term]
            );
            res.status(200).json({ message: 'Balance updated successfully' });
        } else {
            await db.query(
                `INSERT INTO balances (reg_number, class_type, form, year, term, balance, balance_type, currency) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD')`,
                [regNumber, classType, form, year, term, newBalance, balanceType]
            );
            res.status(200).json({ message: 'Balance created and updated successfully' });
        }
    } catch (error) {
        console.error('Error updating student balance:', error);
        res.status(500).json({ message: 'Failed to update student balance' });
    }
};

module.exports = {
    updateStudentBalance,
};
