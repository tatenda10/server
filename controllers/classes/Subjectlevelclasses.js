const db = require('../../db/db');

const addSubjectClass = async (subjectClassData) => {
    const {
        ClassName, Subject, Teacher,TeacherName, Form, ClassType, gradelevelclass
    } = subjectClassData;
    
    const query = `
        INSERT INTO subjectclasses (ClassName, Subject, Teacher,TeacherName, Form, ClassType, gradelevelclass)
        VALUES (?, ?, ?, ?, ?, ?,?)
    `;
    const values = [
        ClassName, Subject, Teacher,TeacherName, Form, ClassType, gradelevelclass
    ];
    
    try {
        const [result] = await db.query(query, values);
        return result.insertId;
    } catch (err) {
        console.error('Error adding subject class:', err);
        throw err;
    }
};

const editSubjectClass = async (classId, subjectClassData) => {
    const {
        ClassName, Subject, Teacher,TeacherName, Form, ClassType, gradelevelclass
    } = subjectClassData;
    
    const query = `
        UPDATE subjectclasses
        SET ClassName = ?, Subject = ?, Teacher = ?,TeacherName = ?, Form = ?, ClassType = ?, gradelevelclass = ?
        WHERE ClassID = ?
    `;
    const values = [
        ClassName, Subject, Teacher,TeacherName, Form, ClassType, gradelevelclass, classId
    ];
    
    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        console.error('Error editing subject class:', err);
        throw err;
    }
};


const deleteSubjectClass = async (classId) => {
    const query = `DELETE FROM subjectclasses WHERE ClassID = ?`;
    
    try {
        const [result] = await db.query(query, [classId]);
        return result.affectedRows;
    } catch (err) {
        console.error('Error deleting subject class:', err);
        throw err;
    }
};


const getSingleSubjectLevelClass = async (classId) => {
    const query = `SELECT * FROM subjectclasses WHERE ClassID = ?`;

    try {
        const [classData] = await db.query(query, [classId]);
        return classData[0]; // Assuming classId is unique and will return a single class
    } catch (err) {
        console.error('Error retrieving class:', err);
        throw err;
    }
};



module.exports = { getSingleSubjectLevelClass, addSubjectClass, editSubjectClass,deleteSubjectClass };
