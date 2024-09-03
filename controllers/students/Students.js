const db = require('../../db/db');

const addStudentWithGuardianAndBalance = async (req, res) => {
  const { studentData, guardians, balanceData } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert student
    const studentQuery = `
      INSERT INTO students (RegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, Gender, HasMedicalAid, PasswordHash, Active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const studentValues = [
      studentData.RegNumber,
      studentData.Name,
      studentData.Surname,
      studentData.DateOfBirth,
      studentData.NationalIDNumber,
      studentData.Address,
      studentData.Gender,
      studentData.HasMedicalAid,
      studentData.PasswordHash,
      1 // Setting Active to true (1)
    ];
    const [studentResult] = await connection.query(studentQuery, studentValues);
    const studentId = studentResult.insertId;

    // Insert into parents table
    const parentQuery = `
      INSERT INTO parents (RegNumber, Password)
      VALUES (?, ?)
    `;
    const parentValues = [
      studentData.RegNumber,
      studentData.PasswordHash // Use the same password hash
    ];
    await connection.query(parentQuery, parentValues);

    // Insert guardians
    const guardianQuery = `
      INSERT INTO guardians (StudentRegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, PhoneNumber, Gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const guardianIds = [];
    for (const guardian of guardians) {
      const guardianValues = [
        studentData.RegNumber,
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

    // Insert balance
    const balanceQuery = `
      INSERT INTO balances (reg_number, class_type, form, term, year, balance, balance_type, currency, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const balanceValues = [
      studentData.RegNumber,
      balanceData.class_type || 'Default Class Type', // default class_type if not provided
      balanceData.form || 1, // default form if not provided
      balanceData.term || 1, // default term if not provided
      balanceData.year || new Date().getFullYear(), // default year if not provided
      balanceData.balance || 0.00, // default balance to 0.00 if not provided
      balanceData.balance_type || 'DR', // default balance_type to 'DR' if not provided
      balanceData.currency || 'USD' // default currency to 'USD' if not provided
    ];
    const [balanceResult] = await connection.query(balanceQuery, balanceValues);
    const balanceId = balanceResult.insertId;

    // Update cached count
    const updateCountQuery = `
      UPDATE cached_counts 
      SET count = count + 1 
      WHERE table_name = 'students'
    `;
    await connection.query(updateCountQuery);

    await connection.commit();
    res.status(201).json({ studentId, guardianIds, balanceId });
  } catch (err) {
    await connection.rollback();
    console.error('Error adding student, guardians, and balance: ', err);
    res.status(500).json({ error: 'Failed to add student, guardians, and balance' });
  } finally {
    connection.release(); 
  }
};
 
const deleteStudent = async (req, res) => {
  const { regnumber } = req.params;
  try {
    await db.query('UPDATE students SET active = 0 WHERE RegNumber = ?', [regnumber]);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addStudentWithGuardianAndBalance,
  deleteStudent
};
