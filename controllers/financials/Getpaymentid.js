const db = require('../../db/db');

// Controller to get a single payment by ID
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [payment] = await db.query(`
            SELECT payments.*, students.Name AS student_name, students.Surname AS student_surname 
            FROM payments 
            LEFT JOIN students ON payments.reg_number = students.RegNumber
            WHERE payments.id = ?
        `, [id]);

        if (payment.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.status(200).json(payment[0]);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ message: 'Failed to retrieve payment' });
    }
};

module.exports = {
    getPaymentById,
};
