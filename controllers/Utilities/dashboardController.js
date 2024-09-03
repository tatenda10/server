const db = require('../../db/db');

// Financials Controller
const getFinancials = async (req, res) => {
    try {
        const [monthlyTotals] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month, 
                SUM(received_amount) AS total
            FROM payments
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        const [currentMonthTotal] = await db.query(`
            SELECT 
                SUM(received_amount) AS total
            FROM payments
            WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
        `);

        res.status(200).json({
            monthlyTotals,
            currentMonthTotal: currentMonthTotal[0].total || 0
        });
    } catch (error) {
        console.error('Error fetching financial data:', error);
        res.status(500).json({ message: 'Failed to retrieve financial data' });
    }
};

// Students Controller
const getStudentStats = async (req, res) => {
    try {
        const [totalStudents] = await db.query(`
            SELECT COUNT(*) AS total FROM students WHERE active = 1
        `);

        const [genderStats] = await db.query(`
            SELECT Gender, COUNT(*) AS count
            FROM students
            WHERE active = 1
            GROUP BY Gender
        `);

        res.status(200).json({
            totalStudents: totalStudents[0].total,
            genderStats
        });
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Failed to retrieve student data' });
    }
};

// Announcements Controller
const getLatestAnnouncement = async (req, res) => {
    try {
        const [latestAnnouncement] = await db.query(`
            SELECT * FROM announcements ORDER BY AnnouncementID DESC LIMIT 1
        `);

        res.status(200).json(latestAnnouncement[0]);
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ message: 'Failed to retrieve announcement' });
    }
};

// Employees Controller
const getEmployeeStats = async (req, res) => {
    try {
        const [totalEmployees] = await db.query(`
            SELECT COUNT(*) AS total FROM employees
        `);

        const [genderStats] = await db.query(`
            SELECT Gender, COUNT(*) AS count
            FROM employees
            GROUP BY Gender
        `);

        res.status(200).json({
            totalEmployees: totalEmployees[0].total,
            genderStats
        });
    } catch (error) {
        console.error('Error fetching employee data:', error);
        res.status(500).json({ message: 'Failed to retrieve employee data' });
    }
};

module.exports = { getFinancials, getStudentStats, getLatestAnnouncement, getEmployeeStats };
