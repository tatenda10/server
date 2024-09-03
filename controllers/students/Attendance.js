const db = require('../../db/db');

// Function to mark attendance
const markAttendance = async (RegNumber, classId, date, term, year, status) => {
    const query = `
        INSERT INTO attendance (RegNumber, ClassID, Date, Term, Year, Status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE Status = ?
    `;
    const values = [RegNumber, classId, date, term, year, status, status];

    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        console.error('Error marking attendance:', err);
        throw err;
    }
};



// Function to update attendance
const updateAttendance = async (RegNumber, classId, date, status) => {
    const query = `
        UPDATE attendance
        SET Status = ?
        WHERE RegNumber = ? AND ClassID = ? AND Date = ?
    `;
    const values = [status, RegNumber, classId, date];

    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        console.error('Error updating attendance:', err);
        throw err;
    }
};

// Function to get attendance for a single student and term
const getAttendanceForStudent = async (regNumber, term, year) => {
    const query = `
        SELECT Date, Status, ClassID
        FROM attendance
        WHERE RegNumber = ? AND Term = ? AND Year = ?
    `;
    const values = [regNumber, term, year];

    try {
        const [attendance] = await db.query(query, values);
        return attendance;
    } catch (err) {
        console.error('Error fetching attendance:', err);
        throw err;
    }
};

module.exports = { markAttendance, updateAttendance, getAttendanceForStudent };
