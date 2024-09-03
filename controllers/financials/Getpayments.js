const db = require('../../db/db');

// Controller to get all payments with pagination
const getAllPayments = async (req, res) => {
    try {
        const { page = 1, pageSize = 100 } = req.query; // Default pageSize to 100

        const offset = (page - 1) * pageSize;

        const [payments] = await db.query(`
            SELECT payments.*, students.Name AS student_name, students.Surname AS student_surname 
            FROM payments 
            LEFT JOIN students ON payments.reg_number = students.RegNumber
            ORDER BY payments.created_at DESC 
            LIMIT ? OFFSET ?
        `, [parseInt(pageSize), parseInt(offset)]);

        const [totalPayments] = await db.query(`
            SELECT COUNT(*) as count FROM payments
        `);

        const totalPages = Math.ceil(totalPayments[0].count / pageSize);

        res.status(200).json({
            payments,
            currentPage: parseInt(page),
            totalPages,
            totalPayments: totalPayments[0].count,
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Failed to retrieve payments' });
    }
};

module.exports = {
    getAllPayments,
};
