const db = require('../../db/db');

const editStudentWithGuardian = async (req, res) => {
  const { studentData, guardians } = req.body;
  const { regNumber } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Update student
    const studentQuery = `
      UPDATE students 
      SET Name = ?, Surname = ?, DateOfBirth = ?, NationalIDNumber = ?, Address = ?, Gender = ?, HasMedicalAid = ?
      WHERE RegNumber = ?
    `;
    const studentValues = [
      studentData.Name,
      studentData.Surname,
      studentData.DateOfBirth,
      studentData.NationalIDNumber,
      studentData.Address,
      studentData.Gender,
      studentData.HasMedicalAid,
      regNumber
    ];
    await connection.query(studentQuery, studentValues);

    // Delete existing guardians
    await connection.query('DELETE FROM guardians WHERE StudentRegNumber = ?', [regNumber]);

    // Insert updated guardians
    const guardianQuery = `
      INSERT INTO guardians (StudentRegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, PhoneNumber, Gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const guardianIds = [];
    for (const guardian of guardians) {
      const guardianValues = [
        regNumber,
        guardian.Name,
        guardian.Surname,
        guardian.DateOfBirth,
        guardian.NationalIDNumber,
        guardian.Address,
        guardian.PhoneNumber,
        guardian.Gender
      ];
      const [guardianResult] = await connection.query(guardianQuery, guardianValues);
      guardianIds.push(guardianResult.insertId);
    }

    await connection.commit();
    res.status(200).json({ message: 'Student updated successfully', guardianIds });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating student and guardians: ', err);
    res.status(500).json({ error: 'Failed to update student and guardians' });
  } finally {
    connection.release();
  }
};

module.exports = {
  
  editStudentWithGuardian
};
