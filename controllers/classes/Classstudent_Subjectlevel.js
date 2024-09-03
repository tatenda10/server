const db = require('../../db/db');

// Function to add a student to a subject class
const addStudentToSubjectClass = async (RegNumber, classId) => {

    const query = `
        INSERT INTO studentclasses_subjects (RegNumber, ClassID)
        VALUES (?, ?)
    `;
    const values = [RegNumber, classId];
    
    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // Handle the duplicate entry error
            console.error('Student is already enrolled in this subject class:', err);
            throw new Error('Student is already enrolled in this subject class.');
        } else {
            console.error('Error adding student to subject class:', err);
            throw err;
        }
    }
};

// Function to remove a student from a subject class
const removeStudentFromSubjectClass = async (RegNumber, classId) => {
    // Query to check if the record exists
    const checkQuery = `
        SELECT COUNT(*) AS count FROM studentclasses_subjects 
        WHERE RegNumber = ? AND ClassID = ?
    `;
    const checkValues = [RegNumber, classId];

    const deleteQuery = `
        DELETE FROM studentclasses_subjects 
        WHERE RegNumber = ? AND ClassID = ?
    `;
    const deleteValues = [RegNumber, classId];

    try {
        // Check if the record exists
        const [checkResult] = await db.query(checkQuery, checkValues);
        const recordExists = checkResult[0].count > 0;

        if (!recordExists) {
            throw new Error('The student is not enrolled in this subject class.');
        }

        // If the record exists, proceed with the deletion
        const [result] = await db.query(deleteQuery, deleteValues);
        return result.affectedRows;
    } catch (err) {
        console.error('Error removing student from subject class:', err);
        throw err;
    }
};



const getStudentsInSubjectClass = async (classId) => {
    const studentQuery = `
        SELECT s.RegNumber, s.Name, s.Surname, s.Gender 
        FROM students s
        JOIN studentclasses_subjects sc ON s.RegNumber = sc.RegNumber
        WHERE sc.ClassID = ?
    `;
    const countQuery = `
        SELECT COUNT(*) as total
        FROM studentclasses_subjects
        WHERE ClassID = ?
    `;
    
    try {
        const [students] = await db.query(studentQuery, [classId]);
        const [countResult] = await db.query(countQuery, [classId]);
        const total = countResult[0].total;

        return { students, total };
    } catch (err) {
        console.error('Error retrieving students in class:', err);
        throw err;
    }
};

module.exports = { getStudentsInSubjectClass, addStudentToSubjectClass, removeStudentFromSubjectClass };
