const db = require('../../db/db');

// Controller to update or alter the student balance
const updateStudentBalance = async (req, res) => {
    const { regNumber, classType, form, year, term, newBalance, balanceType } = req.body;
    const connection = await db.getConnection(); // Get a connection for the transaction

    try {
        // Begin transaction
        await connection.beginTransaction();

        // Check if a record exists for the given regNumber
        const [existingBalance] = await connection.query(
            `SELECT * FROM balances WHERE reg_number = ?`,
            [regNumber]
        );

        if (existingBalance.length) {
            // If a record exists, delete all records with the same reg_number
            await connection.query(
                `DELETE FROM balances WHERE reg_number = ?`,
                [regNumber]
            );
        }

        // Insert the new record for the student
        await connection.query(
            `INSERT INTO balances (reg_number, class_type, form, year, term, balance, balance_type, currency) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'USD')`,
            [regNumber, classType, form, year, term, newBalance, balanceType]
        );

        // Commit transaction
        await connection.commit();

        res.status(200).json({ message: 'Balance created and updated successfully' });
    } catch (error) {
        // Rollback transaction in case of error
        await connection.rollback();
        console.error('Error updating student balance:', error);
        res.status(500).json({ message: 'Failed to update student balance' });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
};

module.exports = { 
    updateStudentBalance,
};
