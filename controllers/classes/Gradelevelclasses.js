const db = require('../../db/db');

const addGradeLevelClass = async (classData) => {
    const {
        ClassName, Form, ClassType, Teacher, TeacherName, Term, Year
    } = classData;

    // Query to check if the class already exists
    const checkQuery = `
        SELECT COUNT(*) as count FROM gradelevelclasses 
        WHERE Form = ? AND ClassType = ?
    `;
    const checkValues = [Form, ClassType];

    try {
        // Check if the class already exists
        const [checkResult] = await db.query(checkQuery, checkValues);
        const classExists = checkResult[0].count > 0;

        if (classExists) {
            throw new Error('Class already exists. You can edit it instead.');
        }

        // If class doesn't exist, insert the new class
        const insertQuery = `
            INSERT INTO gradelevelclasses (ClassName, Form, ClassType, Teacher, TeacherName, Term, Year)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [ClassName, Form, ClassType, Teacher, TeacherName, Term, Year];

        const [result] = await db.query(insertQuery, insertValues);
        return {
            success: true,
            insertId: result.insertId
        };
    } catch (err) {
        console.error('Error adding grade level class:', err);
        throw err; // Re-throw the error to be handled by the calling function
    }
};


const getAllGradeLevelClasses = async () => {
    const query = `SELECT * FROM gradelevelclasses`;

    try {
        const [results] = await db.query(query);
        return results;
    } catch (err) {
        console.error('Error retrieving grade level classes:', err);
        throw err;
    }
};

const getSubjectsOfClass = async (classId) => {
    const query = `
        SELECT * 
        FROM subjectclasses 
        WHERE gradelevelclass = ?
    `;
    
    try {
        const [subjects] = await db.query(query, [classId]);
        return subjects;
    } catch (err) {
        console.error('Error retrieving subjects for class:', err);
        throw err;
    }
};

const deleteClass = async (classId) => {
    const query = `DELETE FROM gradelevelclasses WHERE ClassID = ?`;
    
    try {
        const [result] = await db.query(query, [classId]);
        return result.affectedRows;
    } catch (err) {
        console.error('Error deleting class:', err);
        throw err;
    }
};

const editGradeLevelClass = async (classId, classData) => {
    const {
        ClassName, Form, ClassType, Teacher, TeacherName , Term, Year
    } = classData;
    
    const query = `
        UPDATE gradelevelclasses
        SET ClassName = ?, Form = ?, ClassType = ?, Teacher = ?, TeacherName = ?, Term = ?, Year = ?
        WHERE ClassID = ?
    `;
    const values = [
        ClassName, Form, ClassType, Teacher, TeacherName, Term, Year, classId
    ];
    
    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        console.error('Error updating class:', err);
        throw err;
    }
};

const getSingleGradeLevelClass = async (classId) => {
    const query = `SELECT * FROM gradelevelclasses WHERE ClassID = ?`;

    try {
        const [classData] = await db.query(query, [classId]);
        return classData[0]; // Assuming classId is unique and will return a single class
    } catch (err) {
        console.error('Error retrieving class:', err);
        throw err;
    }
};

module.exports = {
    deleteClass,
    getSubjectsOfClass,
    addGradeLevelClass,
    getAllGradeLevelClasses,
    editGradeLevelClass,
    getSingleGradeLevelClass
};
