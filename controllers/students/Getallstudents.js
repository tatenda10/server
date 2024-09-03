const db = require('../../db/db'); // Ensure correct path to db

const getAllStudents = async (limit, offset) => {
    const query = `SELECT 
        RegNumber,
        Name,
        Surname,
        DateOfBirth,
        NationalIDNumber,
        Address,
        Gender,
        HasMedicalAid
    FROM students
    WHERE active = true
    LIMIT ? OFFSET ?`;
    const [results] = await db.query(query, [limit, offset]);
    return results;
};

const getCachedStudentsCount = async () => {
    const query = `SELECT COUNT(*) as count FROM students WHERE active = true`;
    const [results] = await db.query(query);
    return results[0].count;
};

module.exports = {
    getAllStudents,
    getCachedStudentsCount
};
