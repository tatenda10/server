const db = require('../../db/db');

// Controller to get all temp payments from both tables with pagination
const getAllTempPayments = async (req, res) => {
    try {
        const { page = 1, pageSize = 100 } = req.query; // Default pageSize to 100

        const offset = (page - 1) * pageSize;

        // Combine data from temp_payments and temp_payments2
        const [tempPayments] = await db.query(`
            SELECT * FROM (
                SELECT temp_payments.*, students.Name AS student_name, students.Surname AS student_surname 
                FROM temp_payments 
                LEFT JOIN students ON temp_payments.reg_number = students.RegNumber
                UNION ALL
                SELECT temp_payments2.*, students.Name AS student_name, students.Surname AS student_surname 
                FROM temp_payments2 
                LEFT JOIN students ON temp_payments2.reg_number = students.RegNumber
            ) AS combined_temp_payments
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(pageSize), parseInt(offset)]);

        // Calculate total count from both tables
        const [totalTempPayments] = await db.query(`
            SELECT COUNT(*) as count FROM (
                SELECT id FROM temp_payments
                UNION ALL
                SELECT id FROM temp_payments2
            ) AS combined_count
        `);

        const totalPages = Math.ceil(totalTempPayments[0].count / pageSize);

        res.status(200).json({
            tempPayments,
            currentPage: parseInt(page),
            totalPages,
            totalTempPayments: totalTempPayments[0].count,
        });
    } catch (error) {
        console.error('Error fetching temp payments:', error);
        res.status(500).json({ message: 'Failed to retrieve temp payments' });
    }
};

module.exports = {
    getAllTempPayments,
};
