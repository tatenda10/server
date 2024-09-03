const db = require('../../db/db');

// Controller to search payments with pagination
const searchPayments = async (req, res) => {
    try {
        const { reg_number, term, year, paynow_reference, page = 1, pageSize = 100 } = req.query; // Default pageSize to 100

        const offset = (page - 1) * pageSize;
        
        let whereClauses = [];
        let queryParams = [];

        if (reg_number) {
            whereClauses.push("payments.reg_number LIKE ?");
            queryParams.push(`%${reg_number}%`);
        }

        if (term) {
            whereClauses.push("payments.term = ?");
            queryParams.push(term);
        }

        if (year) {
            whereClauses.push("payments.year = ?");
            queryParams.push(year);
        }

        if (paynow_reference) {
            whereClauses.push("payments.paynow_reference LIKE ?");
            queryParams.push(`%${paynow_reference}%`);
        }

        let whereSQL = '';
        if (whereClauses.length > 0) {
            whereSQL = 'WHERE ' + whereClauses.join(' AND ');
        }

        const [payments] = await db.query(`
            SELECT payments.*, students.Name AS student_name, students.Surname AS student_surname 
            FROM payments 
            LEFT JOIN students ON payments.reg_number = students.RegNumber
            ${whereSQL}
            ORDER BY payments.created_at DESC 
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(pageSize), parseInt(offset)]);

        const [totalPayments] = await db.query(`
            SELECT COUNT(*) as count 
            FROM payments 
            LEFT JOIN students ON payments.reg_number = students.RegNumber
            ${whereSQL}
        `, queryParams);

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
    searchPayments,
};
