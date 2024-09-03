// src/controllers/students/students.js
const db = require('../../db/db'); // Ensure correct path to db

const searchStudents = async (searchTerm) => {
  const query = `
    SELECT 
      RegNumber,
      Name,
      Surname,
      DateOfBirth,
      NationalIDNumber,
      Address,
      Gender,
      HasMedicalAid
    FROM students
    WHERE RegNumber LIKE ? OR Name LIKE ? OR Surname LIKE ?
  `;
  const searchValue = `%${searchTerm}%`;
  const [results] = await db.query(query, [searchValue, searchValue, searchValue]);
  return results;
};

module.exports = {
  searchStudents
};
 