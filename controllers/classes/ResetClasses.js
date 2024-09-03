const db = require('../../db/db'); // Adjust the path as needed

const resetClasses = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete all records from studentclasses
    await connection.query('DELETE FROM studentclasses');

    // Delete all records from studentclasses_subjects
    await connection.query('DELETE FROM studentclasses_subjects');

    await connection.commit();
    res.status(200).json({ message: 'All classes have been reset successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error resetting classes:', error);
    res.status(500).json({ message: 'Failed to reset classes.' });
  } finally {
    connection.release();
  }
};

module.exports = {
  resetClasses,
};
