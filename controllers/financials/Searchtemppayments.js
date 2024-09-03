const db = require('../../db/db');

// Controller to search temporary payments with pagination
const searchTempPayments = async (req, res) => {
    try {
        const { reg_number, term, year, paynow_reference, page = 1, pageSize = 100 } = req.query; // Default pageSize to 100

        const offset = (page - 1) * pageSize;
        
        let whereClauses = [];
        let queryParams = [];

        if (reg_number) {
            whereClauses.push("reg_number LIKE ?");
            queryParams.push(`%${reg_number}%`);
        }

        if (term) {
            whereClauses.push("term = ?");
            queryParams.push(term);
        }

        if (year) {
            whereClauses.push("year = ?");
            queryParams.push(year);
        }

        if (paynow_reference) {
            whereClauses.push("paynow_reference LIKE ?");
            queryParams.push(`%${paynow_reference}%`);
        }

        let whereSQL = '';
        if (whereClauses.length > 0) {
            whereSQL = 'WHERE ' + whereClauses.join(' AND ');
        }

        // Query to get data from temp_payments
        const [tempPayments1] = await db.query(`
            SELECT 'temp_payments' as source_table, id, reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference, status, created_at 
            FROM temp_payments
            ${whereSQL}
        `, queryParams);

        // Query to get data from temp_payments2
        const [tempPayments2] = await db.query(`
            SELECT 'temp_payments2' as source_table, id, reg_number, class_type, form, year, term, received_amount, reported_amount, currency, payment_method, paynow_reference, status, created_at 
            FROM temp_payments2
            ${whereSQL}
        `, queryParams);

        // Combine the results from both tables
        const combinedPayments = [...tempPayments1, ...tempPayments2];

        // Sort combined results by created_at date in descending order
        combinedPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Pagination logic
        const paginatedPayments = combinedPayments.slice(offset, offset + parseInt(pageSize));

        res.status(200).json({
            payments: paginatedPayments,
            currentPage: parseInt(page),
            totalPages: Math.ceil(combinedPayments.length / pageSize),
            totalPayments: combinedPayments.length,
        });
    } catch (error) {
        console.error('Error fetching temporary payments:', error);
        res.status(500).json({ message: 'Failed to retrieve temporary payments' });
    }
};

module.exports = {
    searchTempPayments,
};
